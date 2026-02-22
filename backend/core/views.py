from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.http import HttpResponse


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        'status': 'ok',
        'timestamp': timezone.now().isoformat(),
    })


def privacy_policy(request):
    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy – AcoustiCare</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #2c3e50;
            line-height: 1.7;
            background: #f8fafb;
        }
        .wrapper {
            max-width: 740px;
            margin: 0 auto;
            padding: 48px 24px 80px;
        }
        h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 6px;
            color: #1a2a3a;
        }
        .effective-date {
            font-size: 14px;
            color: #6b7c8d;
            margin-bottom: 36px;
        }
        h2 {
            font-size: 20px;
            font-weight: 600;
            margin-top: 32px;
            margin-bottom: 12px;
            color: #1a2a3a;
        }
        p { margin-bottom: 14px; }
        ul {
            margin: 8px 0 14px 24px;
        }
        li { margin-bottom: 6px; }
        .contact-box {
            background: #edf2f7;
            border-radius: 8px;
            padding: 20px 24px;
            margin-top: 24px;
        }
        .contact-box p { margin-bottom: 4px; }
        .footer {
            margin-top: 48px;
            padding-top: 20px;
            border-top: 1px solid #dce3ea;
            font-size: 13px;
            color: #8a9bac;
        }
    </style>
</head>
<body>
<div class="wrapper">

    <h1>Privacy Policy</h1>
    <p class="effective-date">Effective date: February 22, 2026</p>

    <p>
        AcoustiCare ("we," "our," or "the app") is a mobile health application that
        allows patients to record voice samples and share them with their healthcare
        providers for clinical analysis. We take the privacy and security of your
        personal and health information seriously. This policy explains what we
        collect, why we collect it, how we protect it, and what rights you have.
    </p>

    <h2>1. Information We Collect</h2>
    <p>When you use AcoustiCare, we collect the following:</p>
    <ul>
        <li><strong>Account information</strong> – your first name, last name, email address, age, and the password you create during registration.</li>
        <li><strong>Voice recordings</strong> – audio files you record through the app using your device's microphone. These recordings are considered Protected Health Information (PHI) under HIPAA.</li>
        <li><strong>Consent records</strong> – your digital signature and the date you signed the audio recording consent form.</li>
        <li><strong>Survey responses</strong> – answers to any health-related questionnaires presented in the app.</li>
    </ul>
    <p>We do not collect location data, contacts, browsing history, or any information beyond what is listed above.</p>

    <h2>2. How We Use Your Information</h2>
    <ul>
        <li>To create and manage your patient account.</li>
        <li>To store your voice recordings so that your assigned healthcare provider can review and analyze them.</li>
        <li>To maintain a record of your consent for audio recording.</li>
        <li>To facilitate communication between you and your healthcare provider through the app.</li>
    </ul>
    <p>We do not use your data for advertising, marketing, or any purpose unrelated to your care.</p>

    <h2>3. How We Protect Your Information</h2>
    <p>
        AcoustiCare is built on HIPAA-compliant infrastructure hosted on Amazon Web Services (AWS).
        We have signed a Business Associate Agreement (BAA) with AWS, which legally requires them
        to safeguard any PHI processed through their services. Specific measures include:
    </p>
    <ul>
        <li><strong>Encryption in transit</strong> – all data sent between the app and our servers is encrypted using TLS (HTTPS). Your recordings never travel over an unencrypted connection.</li>
        <li><strong>Encryption at rest</strong> – voice recordings stored in Amazon S3 and patient data stored in our PostgreSQL database are encrypted using AES-256 server-side encryption.</li>
        <li><strong>Network isolation</strong> – our database and application servers run inside a private network (VPC) that is not directly accessible from the internet.</li>
        <li><strong>Access control</strong> – only authenticated users can access the API, and patients can only view their own data. Providers can only view data for patients assigned to them.</li>
        <li><strong>Audit logging</strong> – we maintain logs of system activity through AWS CloudWatch for security monitoring and incident response.</li>
    </ul>

    <h2>4. Who Can See Your Data</h2>
    <p>
        Your health information is only accessible to you and the healthcare provider(s) assigned
        to your account within the app. Our development team may access system logs for
        troubleshooting, but these logs do not contain the content of your recordings.
    </p>
    <p>
        We do not sell, rent, or share your personal information or health data with
        third parties. We will only disclose information if required by law (for example,
        in response to a valid court order).
    </p>

    <h2>5. Data Retention</h2>
    <p>
        We retain your voice recordings and account data for as long as your account is active
        and as needed to provide you with the app's services. If you request deletion of your
        account, we will remove your personal information and recordings within 30 days, except
        where we are legally required to retain certain records.
    </p>

    <h2>6. Your Rights</h2>
    <p>You have the right to:</p>
    <ul>
        <li><strong>Access</strong> – request a copy of the personal and health data we hold about you.</li>
        <li><strong>Correction</strong> – request that we correct any inaccurate information in your account.</li>
        <li><strong>Deletion</strong> – request that we delete your account and all associated data.</li>
        <li><strong>Withdraw consent</strong> – revoke your consent for audio recording at any time. Withdrawing consent does not affect any recordings or analyses completed before your request.</li>
    </ul>
    <p>To exercise any of these rights, contact us using the information below.</p>

    <h2>7. Device Permissions</h2>
    <p>
        AcoustiCare requests access to your device's microphone solely for the purpose of recording
        voice samples. The app will ask for your permission before accessing the microphone, and you
        can revoke this permission at any time through your device settings. We do not access the
        microphone in the background or record without your knowledge.
    </p>

    <h2>8. Children's Privacy</h2>
    <p>
        AcoustiCare is not intended for use by children under the age of 13. We do not knowingly
        collect information from children under 13. If you believe a child has provided us with
        personal information, please contact us and we will delete it promptly.
    </p>

    <h2>9. Changes to This Policy</h2>
    <p>
        We may update this privacy policy from time to time. If we make significant changes, we will
        notify you through the app or by email. The effective date at the top of this page indicates
        when the policy was last revised.
    </p>

    <h2>10. Contact Us</h2>
    <div class="contact-box">
        <p><strong>AcoustiCare Privacy Team</strong></p>
        <p>Email: <a href="mailto:acousticareapp@gmail.com">acousticareapp@gmail.com</a></p>
    </div>

    <div class="footer">
        &copy; 2026 AcoustiCare. All rights reserved.
    </div>

</div>
</body>
</html>"""
    return HttpResponse(html, content_type='text/html')
