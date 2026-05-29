export function buildConfirmationEmail(userName: string, confirmUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirme seu e-mail - CatDog Mário</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #6B4EFF; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🐱 CatDog <span style="color: #FF6B35;">Mário</span></h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">🐾 Plataforma de Adoção Animal 🐾</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #333; margin: 0 0 16px;">Olá, ${userName}! 👋</h2>
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Obrigado por se cadastrar na plataforma CatDog Mário! Para ativar sua conta, clique no botão abaixo:
              </p>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${confirmUrl}" style="display: inline-block; padding: 14px 32px; background-color: #FF6B35; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                      Confirmar meu e-mail
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #777; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
                Este link é válido por <strong>24 horas</strong>. Se você não solicitou este cadastro, ignore este e-mail.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                🐾 CatDog Mário — Conectando animais a novos lares 🐾
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildPasswordResetEmail(userName: string, code: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha - CatDog Mário</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #6B4EFF; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🐱 CatDog <span style="color: #FF6B35;">Mário</span></h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">🐾 Recuperação de Senha 🐾</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #333; margin: 0 0 16px;">Olá, ${userName}!</h2>
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Recebemos uma solicitação para redefinir sua senha. Use o código abaixo:
              </p>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <div style="display: inline-block; padding: 16px 32px; background-color: #f0f0f0; border-radius: 8px; border: 2px dashed #6B4EFF;">
                      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6B4EFF;">${code}</span>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="color: #777; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
                Este código é válido por <strong>15 minutos</strong>. Se você não solicitou a recuperação, ignore este e-mail.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                🐾 CatDog Mário — Conectando animais a novos lares 🐾
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
