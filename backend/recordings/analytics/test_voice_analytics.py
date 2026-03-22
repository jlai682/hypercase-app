#!/usr/bin/env python3
"""
Usage: python test_voice_analytics.py <audio_file.wav>
"""

import sys
import time
import math
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


class MockRecording:
    def __init__(self, audio_path):
        self.audio_file = type('obj', (object,), {'path': audio_path})()


def sanitize(results):
    return {k: (None if isinstance(v, float) and math.isnan(v) else v)
            for k, v in results.items()}


def fmt(value, spec, suffix=''):
    return 'None' if value is None else f"{value:{spec}}{suffix}"


def print_results(r, processing_duration):
    raw = r.get('raw_parameters', {})

    sections = [
        ("JITTER", [
            ("jitter_local",    '.6f', ''),
            ("jitter_absolute", '.8f', ''),
            ("jitter_rap",      '.6f', ''),
            ("jitter_ppq5",     '.6f', ''),
            ("jitter_ddp",      '.6f', ''),
        ]),
        ("SHIMMER", [
            ("shimmer_local",  '.3f', '%'),
            ("shimmer_db",     '.3f', ' dB'),
            ("shimmer_apq3",   '.3f', '%'),
            ("shimmer_apq5",   '.3f', '%'),
            ("shimmer_apq11",  '.3f', '%'),
            ("shimmer_dda",    '.3f', '%'),
        ]),
        ("F0", [
            ("f0_mean",   '.2f', ' Hz'),
            ("f0_median", '.2f', ' Hz'),
            ("f0_min",    '.2f', ' Hz'),
            ("f0_max",    '.2f', ' Hz'),
            ("f0_std",    '.2f', ' Hz'),
        ]),
        ("CPP",  [("cpp_mean",  '.3f', '')]),
        ("HNR",  [
            ("hnr_mean", '.2f', ' dB'),
            ("nhr_mean", '.4f', ''),
        ]),
        ("LTAS", [
            ("ltas_slope", '.6f', ''),
            ("ltas_tilt",  '.3f', ''),
        ]),
        ("NOISE/QUALITY", [
            ("ambient_noise_level",   '.2f', ' dB'),
            ("signal_to_noise_ratio", '.2f', ' dB'),
        ]),
    ]

    print("\n" + "="*60)
    print("VOICE ANALYTICS RESULTS")
    print("="*60)

    for title, fields in sections:
        print(f"\n--- {title} ---")
        for key, spec, suffix in fields:
            print(f"  {key:<26}{fmt(r.get(key), spec, suffix)}")

    print(f"\n  recording_quality:         {r.get('recording_quality', 'N/A')}")
    print(f"  quality_warnings:          {r.get('quality_warnings', [])}")

    print("\n--- DYSPHONIA ---")
    for key in ('jitter_local_flag', 'shimmer_local_flag', 'shimmer_db_flag',
                'hnr_flag', 'nhr_flag', 'dysphonia_severity', 'dysphonia_interpretation'):
        print(f"  {key:<26}{r.get(key, 'N/A')}")

    '''
    print("\n--- AVQI (v03.03) ---")
    try:
        import avqi
        result = avqi.compute_avqi(raw.get('audio_path', ''))
        if result:
            avqi_val = result["AVQI"]
            for key, spec in [("CPPS", '.3f'), ("Shimmer local (%)", '.4f'),
                               ("Shimmer local (dB)", '.4f'), ("HNR", '.3f'),
                               ("Tilt", '.6f'), ("SPL_SD", '.3f')]:
                print(f"  {key:<26}{fmt(result.get(key), spec)}")
            label = "Normal" if avqi_val < 3.5 else "Dysphonic"
            print(f"  {'AVQI':<26}{avqi_val:.3f}  ({label})")
        else:
            print("  AVQI: None")
    except Exception as e:
        print(f"  AVQI error: {e}")
    '''
    print("\n--- METADATA ---")
    print(f"  {'duration':<26}{fmt(raw.get('duration'),           '.2f', 's')}")
    print(f"  {'t_start':<26}{fmt(raw.get('t_start'),             '.3f', 's')}")
    print(f"  {'t_end':<26}{fmt(raw.get('t_end'),                 '.3f', 's')}")
    print(f"  {'sample_rate':<26}{fmt(raw.get('sampling_frequency'), '.0f', ' Hz')}")
    print(f"  {'processing_time':<26}{processing_duration:.2f}s")
    print("\n" + "="*60)


def test_voice_analytics(audio_path):
    start = time.time()
    try:
        if not Path(audio_path).exists():
            return {'status': 'error', 'error': 'File not found'}

        from processor import VoiceAnalyticsProcessor
        processor = VoiceAnalyticsProcessor(MockRecording(audio_path))
        results = sanitize(processor.process())
        duration = time.time() - start

        print_results(results, duration)
        return {'status': 'completed', 'results': results, 'processing_time': duration}

    except Exception as e:
        logger.exception("Failed")
        return {'status': 'error', 'error': str(e)}


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_voice_analytics.py <audio_file.wav>")
        sys.exit(1)

    result = test_voice_analytics(sys.argv[1])
    sys.exit(0 if result['status'] == 'completed' else 1)