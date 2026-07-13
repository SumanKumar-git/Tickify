function getForgotPasswordTemplate(otp){
    return`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Tickify</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f7fb;padding:40px 20px;">
    <tr>
        <td align="center">

            <!-- Email Container -->
            <table width="600" cellpadding="0" cellspacing="0" border="0"
                   style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;">

                <!-- Header -->
                <tr>
                    <td align="center"
                        style="padding:40px;background:linear-gradient(135deg,#4f46e5,#7c3aed);">

                        <div style="
                            color:#ffffff;
                            font-size:34px;
                            font-weight:800;
                            letter-spacing:-1px;">
                            🎟 Tickify
                        </div>

                        <div style="
                            color:#e0e7ff;
                            font-size:15px;
                            margin-top:8px;">
                            Secure Account Recovery
                        </div>

                    </td>
                </tr>

                <!-- Main Content -->
                <tr>
                    <td style="padding:48px 40px;">

                        <h1 style="
                            margin:0;
                            text-align:center;
                            color:#111827;
                            font-size:30px;
                            font-weight:700;">
                            Reset Your Password
                        </h1>

                        <p style="
                            margin:20px 0 35px;
                            text-align:center;
                            color:#6b7280;
                            font-size:16px;
                            line-height:26px;">
                            We received a request to reset the password for your
                            Tickify account. Use the verification code below to
                            continue.
                        </p>

                        <!-- OTP Container -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0"
                               style="
                               background:#f8fafc;
                               border:1px solid #e5e7eb;
                               border-radius:16px;">
                            <tr>
                                <td align="center" style="padding:35px;">

                                    <div style="
                                        color:#6b7280;
                                        font-size:13px;
                                        font-weight:bold;
                                        text-transform:uppercase;
                                        letter-spacing:2px;
                                        margin-bottom:18px;">
                                        Password Reset Code
                                    </div>

                                    <div style="
                                        display:inline-block;
                                        background:#ffffff;
                                        border:2px dashed #c7d2fe;
                                        border-radius:14px;
                                        padding:18px 30px;
                                        color:#4f46e5;
                                        font-size:42px;
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
                                        Enter this code on the password reset screen.
                                    </p>

                                </td>
                            </tr>
                        </table>

                        <!-- Security Alert -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0"
                               style="
                               margin-top:28px;
                               background:#fff7ed;
                               border-left:4px solid #f97316;
                               border-radius:8px;">
                            <tr>
                                <td style="
                                    padding:18px;
                                    color:#7c2d12;
                                    font-size:14px;
                                    line-height:24px;">

                                    <strong>Security Reminder</strong><br>

                                    This OTP expires in
                                    <strong>10 minutes</strong>.

                                    If you did not request a password reset,
                                    please ignore this email. Your password
                                    will remain unchanged.

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
                        Discover • Book • Experience

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

export default getForgotPasswordTemplate;