document.addEventListener("DOMContentLoaded", () => {
    const radioTarjeta = document.getElementById("pagoTarjeta");
    const radioPaypal = document.getElementById("pagoPaypal");
    const formTarjeta = document.getElementById("form-tarjeta");
    const paypalContainer = document.getElementById("paypal-button-container");
    const btnPagar = document.getElementById("btnPagar");

    function actualizarMetodoPago() {
        if (radioPaypal.checked) {
            formTarjeta.style.display = "none";
            paypalContainer.style.display = "block";
        } else {
            formTarjeta.style.display = "block";
            paypalContainer.style.display = "none";
        }
    }

    radioTarjeta.addEventListener("change", actualizarMetodoPago);
    radioPaypal.addEventListener("change", actualizarMetodoPago);

    // Pago con tarjeta
    btnPagar.addEventListener("click", async () => {
        if (radioTarjeta.checked) {
            const nombre = document.getElementById("nombreTarjeta").value;
            const numero = document.getElementById("numeroTarjeta").value;
            const expMes = document.getElementById("expMes").value;
            const expAnio = document.getElementById("expAnio").value;
            const cvv = document.getElementById("cvv").value;

            const expiracion = `${expAnio}-${expMes.padStart(2, "0")}`;

            try {
                const response = await fetch("/api/pago-tarjeta", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nombre, numero, expiracion, cvv })
                });

                const result = await response.json();
                if (result.success) {
                    alert("Pago con tarjeta simulado exitoso. Order ID: " + result.orderID);
                    window.location.href = "/usuarios/confirmacion";
                } else {
                    alert("Error en el pago: " + result.message);
                }
            } catch (error) {
                console.error("Error en pago tarjeta:", error);
                alert("Error al procesar el pago con tarjeta");
            }
        }
    });

    // PayPal (no se toca)
    paypal.Buttons({
        style: { layout: "horizontal", color: "blue", shape: "pill", label: "checkout" },
        createOrder: (data, actions) => {
            return actions.order.create({
                purchase_units: [{ amount: { value: "5000" } }]
            });
        },
        onApprove: (data, actions) => {
            return actions.order.capture().then(async (details) => {
                alert(`Pago exitoso! Gracias, ${details.payer.name.given_name}`);
                const response = await fetch("/usuarios/api/finalizar-compra", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                });
                const result = await response.json();
                if (result.success) {
                    window.location.href = "/usuarios/confirmacion";
                } else {
                    alert("Hubo un problema al registrar la compra: " + result.message);
                }
            });
        }
    }).render("#paypal-button-container");
});
