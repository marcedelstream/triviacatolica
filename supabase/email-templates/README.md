# Plantillas de correo (Supabase Auth)

Se pegan en **Supabase → Authentication → Emails → Templates**. Todas muestran el código de 6 dígitos (`{{ .Token }}`) en vez de un link, porque la app pide el código.

| Plantilla en Supabase | Archivo | Asunto sugerido | Cuándo se envía |
|---|---|---|---|
| **Confirm signup** | `confirm-signup.html` | Tu código para Trivia Católica: {{ .Token }} | Primer ingreso con un correo nuevo (`signInWithOtp` crea el usuario) |
| **Magic Link** | `magic-link.html` | Tu código para Trivia Católica: {{ .Token }} | Ingreso con un correo que ya existe |
| **Reset Password** | `recovery.html` | Recuperá tu cuenta de Trivia Católica | Recuperación de acceso (`resetPasswordForEmail`) |
| **Change Email Address** | `email-change.html` | Confirmá tu nuevo correo | Cambio de correo (`updateUser({ email })`) |
| **Reauthentication** | `reauthentication.html` | Confirmá que sos vos | Acciones sensibles (`reauthenticate()`) |

Importante: **Confirm signup** y **Magic Link** tienen que tener la plantilla con el código. Si solo se cambia una, los usuarios nuevos reciben el link por defecto sin código.

## Configuración necesaria

- **Authentication → Providers → Email → Email OTP Length = 6** (la app valida 6 dígitos).
- **SMTP propio** (Authentication → Emails → SMTP Settings): el SMTP incluido en Supabase tiene un límite muy bajo de envíos por hora y no sirve para producción. Con Purelymail:
  - Host `smtp.purelymail.com`, puerto `465`, usuario = la casilla completa (por ejemplo `hola@triviacatolica.com`) y su contraseña.
  - Remitente: `Trivia Católica <hola@triviacatolica.com>`.
- Después del SMTP propio, subir **Rate Limits → emails per hour** a un valor razonable (por ejemplo 100).
