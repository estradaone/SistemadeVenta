const UserModel = require('../models/modelUser');
const bcrypt = require('bcrypt');
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const { verDetalleProducto, resetPassword } = require('./controllerUser');
const pool = require('../database/db');
const twilio = require('twilio');

const UserControllerMovil = {
    // Registro de cuenta
    async registrarUsuarioMovil(req, res) {
        const { nombre, apellidos, email, password } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const resultado = await UserModel.registrarUsuario({ nombre, apellidos, email, password: hashedPassword });

            const usuarioCompleto = await UserModel.buscarPorId(resultado.insertId);

            return res.status(200).json({
                mensaje: 'Usuario registrado correctamente',
                usuario: usuarioCompleto
            });
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            return res.status(500).json({ error: 'Error interno' });
        }
    },
    // 🔐 Login
    async login(req, res) {
        const { email, password } = req.body;
        try {
            const user = await UserModel.authenticateUser(email, password);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    motivo: 'credenciales_invalidas',
                    error: 'Credenciales inválidas'
                });
            }

            if (user.estado === 'suspendido') {
                return res.status(403).json({
                    success: false,
                    motivo: 'suspendido',
                    error: 'Cuenta suspendida'
                });
            }

            return res.json({
                success: true,
                mensaje: 'Usuario ha iniciado sesión correctamente',
                usuario: user
            });
        } catch (error) {
            console.error('Error en login móvil:', error);
            return res.status(500).json({
                success: false,
                motivo: 'error_interno',
                error: 'Error interno'
            });
        }
    },

    // Obtener todos los productos
    async obtenerTodosLosProductos(req, res) {
        try {
            const productos = await UserModel.obtenerProductos();
            res.json(productos);
        } catch (error) {
            console.error('Error al obtener productos:', error)
            res.status(500).json({ error: 'Error interno' });

        }
    },
    // Obtner productos por categorias
    //Acessorios
    async productosAccesorios(req, res) {
        try {
            const productos = await UserModel.getProductsByCategory('Accesorios');
            res.json(productos)
        } catch (error) {
            console.error('Error al obtener los productos de accesorios:', error);
            res.status(500).send('Error al obtener los productos de accesorios');
        }
    },
    //Bolsos
    async productosBolsos(req, res) {
        try {
            const productos = await UserModel.getProductsByCategory('Bolsos');
            res.json(productos)
        } catch (error) {
            console.error('Error al obtener los productos de bolsos:', error);
            res.status(500).send('Error al obtener los productos de bolsos');
        }
    },
    //Sombreros
    async productosSombreros(req, res) {
        try {
            const productos = await UserModel.getProductsByCategory('Sombreros');
            res.json(productos);
        } catch (error) {
            console.error('Error al obtener los productos de sombreros:', error);
            res.status(500).send('Error al obtener los productos de sombreros');
        }
    },
    //Blusas
    async productosBlusas(req, res) {
        try {
            const productos = await UserModel.getProductsByCategory('Blusas');
            res.json(productos);
        } catch (error) {
            console.error('Error al obtener los productos de blusas:', error);
            res.status(500).send('Error al obtener los productos de blusas');
        }
    },
    //Peluches
    async productosPeluches(req, res) {
        try {
            const productos = await UserModel.getProductsByCategory('Peluches');
            res.json(productos);
        } catch (error) {
            console.error('Error al obtener los productos de peluches:', error);
            res.status(500).send('Error al obtener los productos de peluches');
        }
    },
    //Llaveros
    async productosLlaveros(req, res) {
        try {
            const productos = await UserModel.getProductsByCategory('Llaveros');
            res.json(productos);
        } catch (error) {
            console.error('Error al obtener los productos de llaveros:', error);
            res.status(500).send('Error al obtener los productos de llaveros');
        }
    },

    // 📦 Productos sin categoría (para móvil)
    async productosMovil(req, res) {
        try {
            const productos = await UserModel.obtenerProductosDestacados();
            res.json(productos);
        } catch (error) {
            console.error('Error al obtener productos móviles:', error);
            res.status(500).json({ error: 'Error interno' });
        }
    },


    // 🛍️ Productos con categoría
    async productosConCategoria(req, res) {
        try {
            const productos = await UserModel.obtenerProductosConCategoria();
            res.json(productos);
        } catch (error) {
            console.error('Error al obtener productos con categoría:', error);
            res.status(500).json({ error: 'Error interno' });
        }
    },


    // 📦 Pedidos por usuario
    async pedidos(req, res) {
        const { id_usuario } = req.params;
        try {
            const pedidos = await UserModel.obtenerPedidosPorUsuario(id_usuario);
            res.json(pedidos);
        } catch (error) {
            console.error('Error al obtener pedidos:', error);
            res.status(500).json({ error: 'Error interno' });
        }
    },

    // 📈 Seguimiento por usuario
    async seguimiento(req, res) {
        const { id_usuario } = req.params;
        try {
            const seguimiento = await UserModel.obtenerSeguimientoPorUsuario(id_usuario);
            res.json(seguimiento);
        } catch (error) {
            console.error('Error al obtener seguimiento:', error);
            res.status(500).json({ error: 'Error interno' });
        }
    },

    // 📄 Detalle de producto
    async detalleProducto(req, res) {
        const { id_producto } = req.params;
        try {
            const producto = await UserModel.obtenerProductosPorId(id_producto);
            if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

            const destacados = await UserModel.obtenerProductosDestacados();
            res.json({ producto, destacados });
        } catch (error) {
            console.error('Error al obtener detalle:', error);
            res.status(500).json({ error: 'Error interno' });
        }
    },

    // 🧾 Finalizar compra desde móvil
    async finalizarCompra(req, res) {
        const { id_usuario, carrito, metodo_pago } = req.body;

        if (!id_usuario || !Array.isArray(carrito) || carrito.length === 0) {
            return res.status(400).json({ success: false, message: "Datos inválidos o carrito vacío." });
        }

        try {
            const idPedido = await UserModel.finalizarCompra(id_usuario, carrito, metodo_pago);

            // ✅ Vaciar el carrito después de registrar la compra
            await pool.query('DELETE FROM carrito_movil WHERE id_usuario = ?', [id_usuario]);

            res.json({ success: true, mensaje: 'Compra realizada', id_pedido: idPedido });
        } catch (error) {
            console.error('Error al finalizar compra:', error);
            res.status(500).json({ success: false, message: error.message || 'Error interno' });
        }
    }
    ,


    // 🧾 Ver compra
    async verCompra(req, res) {
        const { id_pedido } = req.params;
        try {
            const resumen = await UserModel.obtenerResumenCompra(id_pedido);
            res.json(resumen);
        } catch (error) {
            console.error('Error al obtener resumen de compra:', error);
            res.status(500).json({ error: 'Error interno' });
        }
    },

    //Detalles del Pedido
    async verDetalleProductoMovil(req, res) {
        const id_producto = req.params.id_producto;

        try {
            const producto = await UserModel.obtenerProductosPorId(id_producto);
            if (!producto) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            const imagenes = await UserModel.obtenerImagenesPorProducto(id_producto);
            const destacados = await UserModel.obtenerProductosDestacados();
            const relacionados = await UserModel.obtenerProductosRelacionados(producto.id_categoria, id_producto);

            res.json({
                producto,
                imagenes,
                destacados,
                relacionados
            });
        } catch (error) {
            console.error('Error al cargar detalle del producto:', error);
            res.status(500).json({ error: 'Error interno' });
        }
    },

    //Direcciones
    // 📦 Guardar nueva dirección
    async guardarNuevaDireccionMovil(req, res) {
        const { id_usuario, telefono, direccion, ciudad, municipio, estado2, codigo_postal } = req.body;

        if (!id_usuario || !telefono || !direccion || !ciudad || !municipio || !estado2 || !codigo_postal) {
            return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
        }

        try {
            await UserModel.agregarDireccion(id_usuario, { telefono, direccion, ciudad, municipio, estado2, codigo_postal });
            res.json({ success: true, message: 'Dirección guardada correctamente.' });
        } catch (error) {
            console.error('Error al guardar dirección móvil:', error);
            res.status(500).json({ success: false, message: 'Error interno.' });
        }
    },

    // 📋 Obtener todas las direcciones del usuario
    async obtenerDireccionesMovil(req, res) {
        const { id_usuario } = req.params;

        if (!id_usuario) {
            return res.status(400).json({ success: false, message: 'ID de usuario requerido.' });
        }

        try {
            const direcciones = await UserModel.obtenerDirecciones(id_usuario);
            res.json({ success: true, direcciones });
        } catch (error) {
            console.error('Error al obtener direcciones móviles:', error);
            res.status(500).json({ success: false, message: 'Error interno.' });
        }
    },

    // 📝 Obtener una dirección específica por ID
    async obtenerDireccionPorIdMovil(req, res) {
        const { id_direccion } = req.params;

        try {
            const direccion = await UserModel.obtenerDireccionPorId(id_direccion);
            if (!direccion) {
                return res.status(404).json({ success: false, message: 'Dirección no encontrada.' });
            }
            res.json({ success: true, direccion });
        } catch (error) {
            console.error('Error al obtener dirección móvil:', error);
            res.status(500).json({ success: false, message: 'Error interno.' });
        }
    },

    // 🔄 Actualizar dirección por ID
    async actualizarDireccionMovil(req, res) {
        const { id_direccion } = req.params;
        const { telefono, direccion, ciudad, municipio, estado2, codigo_postal } = req.body;

        try {
            await UserModel.actualizarDireccionPorId(id_direccion, { telefono, direccion, ciudad, municipio, estado2, codigo_postal });
            res.json({ success: true, message: 'Dirección actualizada correctamente.' });
        } catch (error) {
            console.error('Error al actualizar dirección móvil:', error);
            res.status(500).json({ success: false, message: 'Error interno.' });
        }
    },

    // POST /agregar
    async agregarAlCarritoMovil(req, res) {
        const { id_usuario, id_producto, nombre_producto, precio, imagen_url } = req.body;

        if (!id_usuario || !id_producto || !nombre_producto || !precio || !imagen_url) {
            return res.status(400).json({ success: false, message: "Datos faltantes." });
        }

        try {
            await UserModel.agregarProductoAlCarritoMovil(id_usuario, { id_producto, nombre_producto, precio, imagen_url });
            res.json({ success: true });
        } catch (error) {
            console.error('Error al agregar al carrito móvil:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // POST /eliminar
    async eliminarDelCarritoMovil(req, res) {
        const { id_usuario, id_producto } = req.body;

        if (!id_usuario) {
            return res.status(400).json({ success: false, message: "ID de usuario faltante." });
        }

        try {
            if (id_producto) {
                await UserModel.eliminarProductoDelCarritoMovil(id_usuario, id_producto);
            } else {
                await UserModel.vaciarCarritoMovil(id_usuario); // ✅ borra todo si no hay id_producto
            }
            res.json({ success: true });
        } catch (error) {
            console.error('Error al eliminar del carrito móvil:', error);
            res.status(500).json({ success: false, message: error.message });
        }

    },

    // GET /carritoMovil/:id_usuario
    async obtenerCarritoMovil(req, res) {
        const { id_usuario } = req.params;

        try {
            const carrito = await UserModel.obtenerCarritoMovil(id_usuario);
            res.json(carrito);
        } catch (error) {
            console.error('Error al obtener carrito móvil:', error);
            res.status(500).json({ error: 'Error interno' });
        }
    },
    //Mostrar pedidos
    async obtenerPedidosMovil(req, res) {
        const { id_usuario } = req.params;
        try {
            const pedidos = await UserModel.obtenerPedidosPorUsuario(id_usuario);
            res.json(pedidos);
        } catch (error) {
            console.error("Error al obtener los productos:", error);
            res.status(500).json({ error: "Error interno" });
        }
    },

    async obtenerSeguimientoMovil(req, res) {
        const { id_usuario } = req.params;
        try {
            const seguimiento = await UserModel.obtenerSeguimientoPorUsuario(id_usuario);
            res.json(seguimiento);
        } catch (error) {
            console.error("Error al obtener los seguimientos:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    },
    // Ver a detalle su compra
    async obtenerResumenCompraMovil(req, res) {
        const { id_pedido } = req.params;
        if (!id_pedido) {
            return res.status(400).json({ error: "Falta el parámetro id_pedido" });
        }

        try {
            const { pedido, productos } = await UserModel.obtenerResumenCompra(id_pedido);
            res.json({ pedido, productos });
        } catch (error) {
            console.error("Error al mostrar el detalle de compra:", error);
            res.status(500).json({ error: "Error interno del servidor" })
        }
    },
    //Reordenar pedidos
    async reordenarPedidosMovil(req, res) {
        const idPedido = req.params.id_pedido;
        try {
            const producto = await UserModel.obtenerPedidos(idPedido);
            if (!producto || !producto.id_producto) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json({ id_producto: producto.id_producto });
        } catch (error) {
            console.error('Error al reordenar desde móvil:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    // Mostral reembolso desde Movil
    async verReembolsoMovil(req, res) {
        const id_pedido = req.params.id;
        try {
            const { pedido, productos } = await UserModel.obtenerResumenCompra(id_pedido);

            if (!pedido || pedido.estado !== 'cancelado') {
                return res.status(404).json({ error: 'Este pedido no está cancelado o no existe' });
            }
            res.json({ pedido, productos });
        } catch (error) {
            console.error('Error al cargar reembolso:', error);
            res.status(500).json({ error: 'Error interno del servidor.' });
        }
    },
    // Enviar mensaje
    async enviarMensajeMovil(req, res) {
        const { nombre, email, asunto, mensaje } = req.body;

        try {
            // Inicializar cliente Twilio con variables de entorno
            const client = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );

            // Construir el cuerpo del mensaje
            const body = `📲 Nuevo mensaje desde la app móvil:\n\n👤 Nombre: ${nombre}\n📧 Email: ${email}\n📝 Asunto: ${asunto}\n💬 Mensaje:\n${mensaje}`;

            // Enviar mensaje por WhatsApp
            await client.messages.create({
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, // número sandbox Twilio
                to: `whatsapp:${process.env.TWILIO_WHATSAPP_TO}`,     // tu número
                body
            });

            // Respuesta en JSON para la app móvil
            res.status(200).json({ success: true, mensaje: 'Mensaje enviado correctamente por WhatsApp' });
        } catch (error) {
            console.error('❌ Error al enviar WhatsApp:', error);
            res.status(500).json({ success: false, error: 'Error al enviar el mensaje por WhatsApp' });
        }
    },

    async verPerfilUsuarioMovil(req, res) {
        const { id_usuario } = req.body;
        try {
            const [result] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id_usuario]);
            const usuario = result[0];
            res.status(200).json({ success: true, usuario });
        } catch (error) {
            console.error('Error al cargar el perfil del usuario:', error);
            res.status(500).json({ error: "Error interno del sistema" });
        }
    },

    async actualizarPerfilMovil(req, res) {
        const { id_usuario, nombre, apellidos, email } = req.body;

        try {
            await UserModel.actualizarUsuarios(id_usuario, { nombre, apellidos, email });
            res.status(200).json({ success: true, mensaje: 'Perfil actualizado correctamente' });
        } catch (error) {
            console.error('Error al actualizar perfil del usuario:', error);
            res.status(500).json({ error: "Error interno del sistema" });
        }
    },
    // Enviar token de recuperacion
    async sendResetTokenMovil(req, res) {
        const { email } = req.body;

        try {
            // Verificar si el usuario existe
            const user = await UserModel.authenticateUser(email);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            // Generar token único y establecer tiempo de expiración
            const token = crypto.randomBytes(32).toString('hex');
            const expiration = new Date(Date.now() + 3600000); // 1 hora

            // Guardar el token en la base de datos
            await UserModel.setResetToken(email, token, expiration);

            // Crear enlace de recuperación
            const resetLink = `${process.env.BASE_URL}/usuarios/reset-password/${token}`;

            // Configurar cliente Twilio
            const client = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );

            // Enviar mensaje por WhatsApp
            await client.messages.create({
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, // número sandbox Twilio
                to: `whatsapp:${process.env.TWILIO_WHATSAPP_TO}`,     // tu número
                body: `🔑 Recuperación de contraseña:\n\nHaz clic en el siguiente enlace para restablecer tu contraseña:\n${resetLink}\n\nEste enlace expirará en 1 hora.`
            });

            // Respuesta en JSON para la app móvil
            res.status(200).json({ success: true, message: 'Enlace de recuperación enviado por WhatsApp' });
        } catch (error) {
            console.error('❌ Error al enviar WhatsApp:', error);
            res.status(500).json({ success: false, message: 'Error al enviar el enlace por WhatsApp' });
        }
    },

    async resetPasswordMovil(req, res) {
        const { token, newPassword } = req.body;

        try {
            const user = await UserModel.verifyResetToken(token);
            if (!user) {
                return res.status(400).json({ success: false, message: 'Token inválido o expirado' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await UserModel.updatePassword(user.id_usuario, hashedPassword);

            res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
        } catch (error) {
            console.error('Error al actualizar la contraseña:', error);
            res.status(500).json({ success: false, message: 'Error al actualizar la contraseña' });
        }
    },
    //Buscar productos movil
    async buscarProductosMovil(req, res) {
        const searchTerm = req.query.search || '';
        try {
            const productos = await UserModel.buscarProductos(searchTerm);

            // Devuelve JSON para consumo móvil
            res.json(productos);
        } catch (error) {
            console.error('Error al buscar productos desde móvil:', error);
            res.status(500).json({ productos: [], error: 'Error interno del servidor' });
        }
    }

};

module.exports = UserControllerMovil;
