import parselmouth
from parselmouth.praat import call
import numpy as np
import logging

logger = logging.getLogger(__name__)


class VoiceAnalyticsProcessor:
    """Process audio files using Parselmouth (Praat)."""

    # TODO: Double check these params and params in every call() method
    DEFAULT_PARAMS = {
        'pitch_floor': 75,
        'pitch_ceiling': 500,
        'time_step': 0.01,
        'max_formant': 5500,
        'silence_threshold': 0.03,
        'voicing_threshold': 0.45,
    }

    def __init__(self, recording, params=None):
        self.recording = recording
        self.params = {**self.DEFAULT_PARAMS, **(params or {})}
        self.sound = None
        self.pitch = None
        self.point_process = None

    def load_audio(self):
        """Load audio file."""
        audio_path = self.recording.audio_file.path
        logger.info(f"Loading: {audio_path}")

        self.sound = parselmouth.Sound(audio_path)
        logger.info(f"Loaded: duration={self.sound.duration}s")
        return True

    def extract_pitch(self):
        """Extract pitch object."""
        self.pitch = call(
            self.sound, "To Pitch",
            self.params['time_step'],
            self.params['pitch_floor'],
            self.params['pitch_ceiling']
        )

    def extract_point_process(self):
        """Extract point process."""
        self.point_process = call(
            self.sound, "To PointProcess (periodic, cc)",
            self.params['pitch_floor'],
            self.params['pitch_ceiling']
        )

    def calculate_jitter(self):
        """Calculate jitter parameters."""
        if self.point_process is None:
            self.extract_point_process()

        return {
            'jitter_local': call(self.point_process, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3),
            'jitter_absolute': call(self.point_process, "Get jitter (local, absolute)", 0, 0, 0.0001, 0.02, 1.3),
            'jitter_rap': call(self.point_process, "Get jitter (rap)", 0, 0, 0.0001, 0.02, 1.3),
            'jitter_ppq5': call(self.point_process, "Get jitter (ppq5)", 0, 0, 0.0001, 0.02, 1.3),
            'jitter_ddp': call(self.point_process, "Get jitter (ddp)", 0, 0, 0.0001, 0.02, 1.3),
        }

    def calculate_shimmer(self):
        """Calculate shimmer parameters."""
        if self.point_process is None:
            self.extract_point_process()

        return {
            'shimmer_local': call([self.sound, self.point_process], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6),
            'shimmer_db': call([self.sound, self.point_process], "Get shimmer (local_dB)", 0, 0, 0.0001, 0.02, 1.3, 1.6),
            'shimmer_apq3': call([self.sound, self.point_process], "Get shimmer (apq3)", 0, 0, 0.0001, 0.02, 1.3, 1.6),
            'shimmer_apq5': call([self.sound, self.point_process], "Get shimmer (apq5)", 0, 0, 0.0001, 0.02, 1.3, 1.6),
            'shimmer_apq11': call([self.sound, self.point_process], "Get shimmer (apq11)", 0, 0, 0.0001, 0.02, 1.3, 1.6),
            'shimmer_dda': call([self.sound, self.point_process], "Get shimmer (dda)", 0, 0, 0.0001, 0.02, 1.3, 1.6),
        }

    def calculate_f0_parameters(self):
        """Calculate F0 parameters."""
        if self.pitch is None:
            self.extract_pitch()

        f0_values = self.pitch.selected_array['frequency']
        f0_values = f0_values[f0_values != 0]

        if len(f0_values) == 0:
            return {
                'f0_mean': None, 'f0_min': None, 'f0_max': None,
                'f0_std': None, 'f0_voiced_frames': 0,
            }

        return {
            'f0_mean': float(np.mean(f0_values)),
            'f0_min': float(np.min(f0_values)),
            'f0_max': float(np.max(f0_values)),
            'f0_std': float(np.std(f0_values)),
            'f0_voiced_frames': len(f0_values),
        }

    def calculate_cpp(self):
        """Calculate CPP."""
        power_cepstrogram = call(self.sound, "To PowerCepstrogram", 0.01, 0.002, 5000, 50)
        cpp = call(power_cepstrogram, "Get CPPS", "yes", 0.01, 0.001, 60, 330, 0.05, "Parabolic", 0.001, 0, "Straight", "Robust")
        return {'cpp_mean': cpp, 'cpp_std': None}

    def calculate_hnr(self):
        """Calculate HNR."""
        harmonicity = call(self.sound, "To Harmonicity (cc)", 0.01, self.params['pitch_floor'], 0.1, 1.0)
        # Access values directly from harmonicity object (values is a 2D array)
        hnr_values = harmonicity.values[0]
        # Filter out NaN values (Parselmouth uses NaN for undefined values)
        hnr_values = hnr_values[~np.isnan(hnr_values)]

        if len(hnr_values) == 0:
            return {'hnr_mean': None, 'hnr_min': None, 'hnr_max': None}

        return {
            'hnr_mean': float(np.mean(hnr_values)),
            'hnr_min': float(np.min(hnr_values)),
            'hnr_max': float(np.max(hnr_values)),
        }

    def calculate_ltas(self):
        """Calculate LTAS parameters."""
        ltas = call(self.sound, "To Ltas", 100)
        # Use Praat commands to get LTAS properties
        lowest_freq = call(ltas, "Get lowest frequency")
        highest_freq = call(ltas, "Get highest frequency")
        n_bins = call(ltas, "Get number of bins")

        # Create frequency array
        freqs = np.linspace(lowest_freq, highest_freq, int(n_bins))
        # Get power values for each bin
        powers = np.array([call(ltas, "Get value in bin", i) for i in range(1, int(n_bins) + 1)])

        slope, _ = np.polyfit(freqs, powers, 1)
        low_freq_power = np.mean(powers[:len(powers)//2])
        high_freq_power = np.mean(powers[len(powers)//2:])
        tilt = low_freq_power - high_freq_power

        return {
            'ltas_slope': float(slope),
            'ltas_tilt': float(tilt),
        }

    def calculate_noise_level(self):
        """Estimate noise level."""
        intensity = call(self.sound, "To Intensity", 100, 0, "yes")
        # Access values directly from intensity object (values is a 2D array)
        intensity_values = intensity.values[0]
        # Filter out NaN values
        intensity_array = intensity_values[~np.isnan(intensity_values)]

        if len(intensity_array) == 0:
            return {
                'ambient_noise_level': None,
                'signal_to_noise_ratio': None,
            }

        noise_threshold = np.percentile(intensity_array, 10)
        noise_values = intensity_array[intensity_array < noise_threshold]
        noise_level = float(np.median(noise_values)) if len(noise_values) > 0 else None
        signal_level = float(np.median(intensity_array))
        snr = signal_level - noise_level if noise_level else None

        return {
            'ambient_noise_level': noise_level,
            'signal_to_noise_ratio': snr,
        }

    def determine_recording_quality(self, noise_level, snr):
        """Determine quality."""
        warnings = []

        if noise_level and noise_level > 30:
            warnings.append(f"High ambient noise ({noise_level:.1f} dB)")

        if snr is None:
            quality = 'unknown'
        elif snr > 20:
            quality = 'excellent'
        elif snr > 10:
            quality = 'good'
        elif snr > 5:
            quality = 'fair'
            warnings.append(f"Low SNR ({snr:.1f} dB)")
        else:
            quality = 'poor'
            warnings.append(f"Very low SNR ({snr:.1f} dB)")

        return quality, warnings

    def process(self):
        """Run full processing pipeline."""
        results = {}

        self.load_audio()
        self.extract_pitch()
        self.extract_point_process()

        logger.info("Calculating jitter...")
        results.update(self.calculate_jitter())

        logger.info("Calculating shimmer...")
        results.update(self.calculate_shimmer())

        logger.info("Calculating F0...")
        results.update(self.calculate_f0_parameters())

        logger.info("Calculating CPP...")
        results.update(self.calculate_cpp())

        logger.info("Calculating HNR...")
        results.update(self.calculate_hnr())

        logger.info("Calculating LTAS...")
        results.update(self.calculate_ltas())

        logger.info("Calculating noise...")
        noise_metrics = self.calculate_noise_level()
        results.update(noise_metrics)

        quality, warnings = self.determine_recording_quality(
            noise_metrics['ambient_noise_level'],
            noise_metrics['signal_to_noise_ratio']
        )
        results['recording_quality'] = quality
        results['quality_warnings'] = warnings

        results['raw_parameters'] = {
            'duration': self.sound.duration,
            'sampling_frequency': self.sound.sampling_frequency,
        }

        logger.info(f"Complete. Quality: {quality}")
        return results
