function getEmailVerificationTemplate(otp){
    return`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Tickify</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f7fb;padding:40px 20px;">
    <tr>
        <td align="center">

            <!-- Main Container -->
            <table width="600" cellpadding="0" cellspacing="0" border="0"
                   style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">

                <!-- Header -->
                <tr>
                    <td align="center"
                        style="padding:40px;background:linear-gradient(135deg,#4f46e5,#7c3aed);">

                        <div style="font-size:34px;font-weight:800;color:#ffffff;">
                            🎟 Tickify
                        </div>

                        <div style="margin-top:10px;font-size:15px;color:#e0e7ff;">
                            Discover • Book • Experience
                        </div>

                    </td>
                </tr>

                <!-- Content -->
                <tr>
                    <td style="padding:48px 40px;">

                        <h1 style="
                            margin:0;
                            text-align:center;
                            color:#111827;
                            font-size:30px;
                            font-weight:700;">
                            Verify Your Email
                        </h1>

                        <p style="
                            margin:20px 0 35px;
                            text-align:center;
                            color:#6b7280;
                            font-size:16px;
                            line-height:26px;">
                            Welcome to Tickify! Enter the verification code below
                            to activate your account and start booking amazing events.
                        </p>

                        <!-- OTP Card -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0"
                               style="
                               background:#f8fafc;
                               border:1px solid #e5e7eb;
                               border-radius:16px;">
                            <tr>
                                <td align="center" style="padding:32px;">

                                    <div style="
                                        color:#6b7280;
                                        font-size:13px;
                                        font-weight:bold;
                                        letter-spacing:2px;
                                        text-transform:uppercase;
                                        margin-bottom:18px;">
                                        Verification Code
                                    </div>

                                    <div style="
                                        display:inline-block;
                                        background:#ffffff;
                                        border:2px dashed #c7d2fe;
                                        border-radius:14px;
                                        padding:18px 30px;
                                        color:#4f46e5;
                                        font-size:40px;
                                        font-weight:800;
                                        letter-spacing:12px;
                                        font-family:monospace;">
                                        ${otp}
                                    </div>

                                    <p style="
                                        margin:20px 0 0;
                                        color:#6b7280;
                                        font-size:14px;
                                        line-height:22px;">
                                        Enter this code in the Tickify app to verify your email address.
                                    </p>

                                </td>
                            </tr>
                        </table>

                        <!-- Security Notice -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0"
                               style="
                               margin-top:28px;
                               background:#eef2ff;
                               border-left:4px solid #4f46e5;
                               border-radius:8px;">
                            <tr>
                                <td style="
                                    padding:18px;
                                    color:#4b5563;
                                    font-size:14px;
                                    line-height:24px;">

                                    <strong>Security Notice</strong><br>

                                    This verification code will expire in
                                    <strong>10 minutes</strong>.

                                    Never share this code with anyone.
                                    Tickify will never ask for your verification code.

                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td align="center"
                        style="
                        border-top:1px solid #e5e7eb;
                        padding:30px;
                        color:#9ca3af;
                        font-size:13px;
                        line-height:22px;">

                        <strong style="color:#6b7280;">Tickify</strong><br>
                        Making event discovery and booking effortless.

                        <br><br>

                        © 2026 Tickify. All rights reserved.

                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>

    `
}

export default getEmailVerificationTemplate;