const twilio = require('twilio');

async function enviarMensajeWhatsApp(req, res) {
    const { nombre, email, asunto, mensaje } = req.body;

    try {
        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        const body = `📩 Nuevo mensaje de contacto:\n\n👤 Nombre: ${nombre}\n📧 Email: ${email}\n📝 Asunto: ${asunto}\n💬 Mensaje:\n${mensaje}`;

        await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, // sandbox Twilio
            to: `whatsapp:${process.env.TWILIO_WHATSAPP_TO}`,     // tu número
            body
        });

        res.redirect('/ayuda?enviado=true');
    } catch (error) {
        console.error('❌ Error al enviar WhatsApp:', error);
        res.redirect('/ayuda?error=true');
    }
}

module.exports = {
    enviarMensajeWhatsApp
};
