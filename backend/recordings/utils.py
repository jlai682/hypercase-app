from django.core import signing

RECORDING_URL_EXPIRY = 3600  # 1 hour in seconds


def generate_recording_token(file_path):
    """Generate a time-limited signed token for accessing a recording file.

    Uses Django's signing framework (HMAC with SECRET_KEY) to produce a
    URL-safe token that encodes the file path and a timestamp.
    """
    return signing.dumps(file_path, salt='recording-access')


def verify_recording_token(token, file_path):
    """Verify a signed recording token matches the file path and hasn't expired."""
    try:
        original = signing.loads(
            token, salt='recording-access', max_age=RECORDING_URL_EXPIRY
        )
        return original == file_path
    except (signing.BadSignature, signing.SignatureExpired):
        return False
