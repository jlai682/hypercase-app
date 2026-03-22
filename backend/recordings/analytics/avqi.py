import parselmouth
import numpy as np
from parselmouth.praat import call
from scipy.stats import linregress


def compute_cpps(sound):
    power_cepstrogram = call(sound, "To PowerCepstrogram",
                             0.01,   # time step (s)
                             0.001,  # window length (s)
                             5000,   # maximum frequency (Hz)
                             50)     # pre-emphasis from (Hz)
    cpps = call(power_cepstrogram, "Get CPPS",
                "yes",        # subtract trend before smoothing
                0.02,         # time averaging window (s)
                0.0005,       # quefrency averaging window (s)
                60, 330,      # peak search pitch range (Hz)
                0.05,         # tolerance
                "Parabolic",  # interpolation
                0.001, 0.05,  # trend line quefrency range (s)
                "Straight",   # trend type ("Straight" or "Exponential decay")
                "Robust slow" # fit method
                )
    return cpps


def compute_shimmer(sound):
    pitch = call(sound, "To Pitch", 0.0, 75, 600)
    point_process = call(sound, "To PointProcess (periodic, cc)", 75, 600)

    shimmer_local = call([sound, point_process], "Get shimmer (local)",
                         0, 0, 0.0001, 0.02, 1.3, 1.6)
    shimmer_local_db = call([sound, point_process], "Get shimmer (local_dB)",
                            0, 0, 0.0001, 0.02, 1.3, 1.6)

    return shimmer_local, shimmer_local_db


def compute_hnr(sound):
    harmonicity = call(sound, "To Harmonicity (cc)", 0.01, 75, 0.1, 1.0)
    hnr = call(harmonicity, "Get mean", 0, 0)
    return hnr


def compute_tilt(sound):
    spectrum = sound.to_spectrum()
    freqs = spectrum.xs()
    
    # values shape is (2, n_freqs): real and imaginary parts
    real = spectrum.values[0]
    imag = spectrum.values[1]
    
    # Compute amplitude (magnitude) from real + imaginary components
    amps = np.sqrt(real**2 + imag**2)  # shape: (n_freqs,) — now 1D ✓

    # Convert amplitude to dB
    amps_db = 20 * np.log10(np.maximum(amps, 1e-12))

    slope, intercept, r, p, se = linregress(freqs, amps_db)
    return slope

def compute_spl_sd(sound):
    intensity = sound.to_intensity()
    values = intensity.values[0]
    return np.std(values)


def compute_avqi(audio_path):
    sound = parselmouth.Sound(audio_path)

    # Extract all parameters
    cpps = compute_cpps(sound)
    shimmer_local, shimmer_local_db = compute_shimmer(sound)
    hnr = compute_hnr(sound)
    tilt = compute_tilt(sound)
    spl_sd = compute_spl_sd(sound)

    # AVQI 03.03 regression equation
    avqi = (3.262
            - 0.161 * cpps
            + 0.006 * shimmer_local
            + 0.137 * shimmer_local_db
            - 0.041 * hnr
            + 0.002 * tilt
            - 0.062 * spl_sd)

    features = {
        "CPPS": cpps,
        "Shimmer local (%)": shimmer_local,
        "Shimmer local (dB)": shimmer_local_db,
        "HNR": hnr,
        "Tilt": tilt,
        "SPL_SD": spl_sd,
        "AVQI": avqi,
    }

    return features


if __name__ == "__main__":
    # Example usage:
    features = compute_avqi("voice_sample.wav")
    print(features)