import parselmouth
from parselmouth.praat import call
import numpy as np
import logging

logger = logging.getLogger(__name__)


class VoiceAnalyticsProcessor:

    DEFAULT_PARAMS = {
        'pitch_floor':          75,
        'pitch_ceiling':        500,
        'time_step':            0,
        'silence_threshold':    0.03,
        'voicing_threshold':    0.45,
        'octave_cost':          0.15,
        'octave_jump_cost':     0.35,
        'voiced_unvoiced_cost': 0.14,
        'max_candidates':       15,
        'very_accurate':        False,
    }

    def __init__(self, recording, params=None):
        self.recording = recording
        self.params = {**self.DEFAULT_PARAMS, **(params or {})}
        self.sound = None
        self.pitch = None
        self.point_process = None
        self.t_start = 0
        self.t_end = 0

    # -------------------------------------------------------------------------
    # Audio loading and interval detection
    # -------------------------------------------------------------------------

    def load_audio(self):
        audio_path = self.recording.audio_file.path
        logger.info(f"Loading: {audio_path}")
        self.sound = parselmouth.Sound(audio_path)
        logger.info(f"Loaded: duration={self.sound.duration:.3f}s")

    # -------------------------------------------------------------------------
    # Feature extraction
    # -------------------------------------------------------------------------

    def extract_pitch(self):
        self.pitch = call(
            self.sound, "To Pitch (cc)",
            self.params['time_step'],
            self.params['pitch_floor'],
            self.params['max_candidates'],
            self.params['very_accurate'],
            self.params['silence_threshold'],
            self.params['voicing_threshold'],
            self.params['octave_cost'],
            self.params['octave_jump_cost'],
            self.params['voiced_unvoiced_cost'],
            self.params['pitch_ceiling'],
        )

    def extract_point_process(self):
        if self.pitch is None:
            self.extract_pitch()
        self.point_process = call([self.sound, self.pitch], "To PointProcess (cc)")

    def calculate_jitter(self):
        t0, t1 = self.t_start, self.t_end
        pp = self.point_process
        args = (pp, t0, t1, 0.0001, 0.02, 1.3)
        return {
            'jitter_local':    call(*args[:1], "Get jitter (local)",           *args[1:]) * 100,
            'jitter_absolute': call(*args[:1], "Get jitter (local, absolute)", *args[1:]),
            'jitter_rap':      call(*args[:1], "Get jitter (rap)",             *args[1:]) * 100,
            'jitter_ppq5':     call(*args[:1], "Get jitter (ppq5)",            *args[1:]) * 100,
            'jitter_ddp':      call(*args[:1], "Get jitter (ddp)",             *args[1:]) * 100,
        }

    def calculate_shimmer(self):
        t0, t1 = self.t_start, self.t_end
        obj = [self.sound, self.point_process]
        args = (obj, t0, t1, 0.0001, 0.02, 1.3, 1.6)
        return {
            'shimmer_local':  call(*args[:1], "Get shimmer (local)",    *args[1:]) * 100,
            'shimmer_db':     call(*args[:1], "Get shimmer (local_dB)", *args[1:]),
            'shimmer_apq3':   call(*args[:1], "Get shimmer (apq3)",     *args[1:]) * 100,
            'shimmer_apq5':   call(*args[:1], "Get shimmer (apq5)",     *args[1:]) * 100,
            'shimmer_apq11':  call(*args[:1], "Get shimmer (apq11)",    *args[1:]) * 100,
            'shimmer_dda':    call(*args[:1], "Get shimmer (dda)",      *args[1:]) * 100,
        }

    def calculate_f0(self):
        f0 = self.pitch.selected_array['frequency']
        f0 = f0[(f0 > 0) & (f0 < self.params['pitch_ceiling'])]
        if len(f0) == 0:
            return {k: None for k in ('f0_mean','f0_median','f0_min','f0_max','f0_std','f0_voiced_frames')}
        return {
            'f0_mean':          float(np.mean(f0)),
            'f0_median':        float(np.median(f0)),
            'f0_min':           float(np.min(f0)),
            'f0_max':           float(np.max(f0)),
            'f0_std':           float(np.std(f0)),
            'f0_voiced_frames': len(f0),
        }

    def calculate_cpp(self):
        cepstrogram = call(self.sound, "To PowerCepstrogram", 0.01, 0.002, 5000, 50)
        cpp = call(cepstrogram, "Get CPPS", "yes", 0.01, 0.001, 60, 330, 0.05,
                   "Parabolic", 0.001, 0, "Straight", "Robust")
        return {'cpp_mean': cpp}

    def calculate_hnr(self):
        import re
        report = call(
            [self.sound, self.pitch, self.point_process], "Voice report",
            self.t_start, self.t_end,
            self.params['pitch_floor'],
            self.params['pitch_ceiling'],
            1.3, 1.6,
            self.params['silence_threshold'],
            self.params['voicing_threshold'],
        )
        def extract(label):
            m = re.search(rf"{re.escape(label)}\s+([\d.]+(?:e[+-]?\d+)?)", report)
            return float(m.group(1)) if m else None

        return {
            'hnr_mean':             extract("Mean harmonics-to-noise ratio:"),
            'nhr_mean':             extract("Mean noise-to-harmonics ratio:"),
            'autocorrelation_mean': extract("Mean autocorrelation:"),
        }

    def calculate_ltas(self):
        ltas = call(self.sound, "To Ltas", 100)
        n    = int(call(ltas, "Get number of bins"))
        f0   = call(ltas, "Get lowest frequency")
        f1   = call(ltas, "Get highest frequency")
        freqs  = np.linspace(f0, f1, n)
        powers = np.array([call(ltas, "Get value in bin", i) for i in range(1, n + 1)])
        slope, _ = np.polyfit(freqs, powers, 1)
        tilt = np.mean(powers[:n//2]) - np.mean(powers[n//2:])
        return {'ltas_slope': float(slope), 'ltas_tilt': float(tilt)}

    def calculate_noise_level(self):
        intensity = call(self.sound, "To Intensity", 100, 0, "yes")
        vals = intensity.values[0]
        vals = vals[~np.isnan(vals)]
        if len(vals) == 0:
            return {'ambient_noise_level': None, 'signal_to_noise_ratio': None}
        noise = vals[vals < np.percentile(vals, 10)]
        noise_level  = float(np.median(noise)) if len(noise) else None
        signal_level = float(np.median(vals))
        return {
            'ambient_noise_level':    noise_level,
            'signal_to_noise_ratio':  signal_level - noise_level if noise_level else None,
        }

    def determine_recording_quality(self, noise_level, snr):
        warnings = []
        if noise_level and noise_level > 30:
            warnings.append(f"High ambient noise ({noise_level:.1f} dB)")
        if snr is None:
            quality = 'unknown'
        elif snr > 20: quality = 'excellent'
        elif snr > 10: quality = 'good'
        elif snr > 5:
            quality = 'fair'
            warnings.append(f"Low SNR ({snr:.1f} dB)")
        else:
            quality = 'poor'
            warnings.append(f"Very low SNR ({snr:.1f} dB)")
        return quality, warnings

    def classify_dysphonia(self, results):
        THRESHOLDS = {
            'jitter_local':  (0.5,  1.04, 2.0,  False),
            'shimmer_local': (2.5,  3.81, 6.0,  False),
            'shimmer_db':    (0.25, 0.35, 0.5,  False),
            'hnr_mean':      (20.0, 15.0, 10.0, True),
            'nhr_mean':      (0.14, 0.19, 0.25, False),
        }
        LABELS = ['normal', 'mild dysphonia', 'moderate dysphonia', 'severe dysphonia']

        def flag(value, mild, moderate, severe, invert):
            if value is None:
                return None
            thresholds = [mild, moderate, severe]
            if invert:
                return next((i+1 for i, t in enumerate(thresholds) if value <= t), 0)
            return next((3-i for i, t in enumerate(reversed(thresholds)) if value >= t), 0)

        flags = {f'{k}_flag': flag(results.get(k), *v) for k, v in THRESHOLDS.items()}
        vals  = [v for v in flags.values() if v is not None]

        if not vals:
            return {**flags, 'dysphonia_severity': None, 'dysphonia_interpretation': 'insufficient data'}

        weighted  = 0.6 * max(vals) + 0.4 * (sum(vals) / len(vals))
        severity  = min(3, int(weighted + 0.5))
        return {**flags, 'dysphonia_severity': severity, 'dysphonia_interpretation': LABELS[severity]}

    # -------------------------------------------------------------------------
    # Pipeline
    # -------------------------------------------------------------------------

    def process(self):
        results = {}

        self.load_audio()

        self.extract_pitch()
        self.extract_point_process()

        for label, fn in [
            ("jitter",     self.calculate_jitter),
            ("shimmer",    self.calculate_shimmer),
            ("F0",         self.calculate_f0),
            ("CPP",        self.calculate_cpp),
            ("HNR",        self.calculate_hnr),
            ("LTAS",       self.calculate_ltas),
            ("dysphonia",  lambda: self.classify_dysphonia(results)),
        ]:
            logger.info(f"Calculating {label}...")
            results.update(fn())

        logger.info("Calculating noise...")
        noise = self.calculate_noise_level()
        results.update(noise)

        quality, warnings = self.determine_recording_quality(
            noise['ambient_noise_level'], noise['signal_to_noise_ratio']
        )
        results['recording_quality'] = quality
        results['quality_warnings']  = warnings
        results['raw_parameters'] = {
            'duration':           self.sound.duration,
            'sampling_frequency': self.sound.sampling_frequency,
            't_start':            self.t_start,
            't_end':              self.t_end,
        }

        logger.info(f"Complete. Quality: {quality}")
        return results