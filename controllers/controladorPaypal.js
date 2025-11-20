const paypal = require('@paypal/checkout-server-sdk');
const pool = require('../database/db'); // si usas conexión a DB


const environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

module.exports = {
    async pagoTarjeta(req, res) {
        const { nombre, numero, expiracion, cvv } = req.body;

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: "CAPTURE",
            purchase_units: [{
                amount: {
                    currency_code: "MXN",
                    value: "500.00"
                }
            }],
            payment_source: {
                card: {
                    number: numero,
                    expiry: expiracion,
                    security_code: cvv,
                    name: nombre,
                    billing_address: {
                        address_line_1: "Calle Falsa 123",
                        admin_area_2: "Ciudad",
                        admin_area_1: "Estado",
                        postal_code: "12345",
                        country_code: "MX"
                    }
                }
            }
        });

        try {
            const order = await client.execute(request);

            // Aquí puedes guardar el orderID en tu DB si lo deseas
            // await pool.query('INSERT INTO pagos_tarjeta (...) VALUES (...)');

            res.json({ success: true, orderID: order.result.id });
        } catch (error) {
            console.error("Error al crear orden con tarjeta:", error);
            res.status(500).json({ success: false, message: "Error al procesar pago con tarjeta" });
        }
    }
};
