console.log("🚀 SERVER INICIADO");

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

require("dotenv").config();
console.log("🚀 SERVER INICIADO");
console.log("RESEND_API_KEY =", process.env.RESEND_API_KEY ? "CARGADA" : "NO CARGADA");

// =================================================
// 📧 CONFIGURACIÓN DE RESEND
// =================================================
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Email de prueba para verificar la conexión
resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'johanlopezcordoba9@gmail.com',
  subject: 'Hello World',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
}).then(response => {
  console.log("✅ Resend configurado correctamente");
}).catch(error => {
  console.error("❌ Error al configurar Resend:", error);
});

const app = express();

app.use(cors());
app.use(express.json({
  limit: "50mb"
}));
app.use(express.urlencoded({
  limit: "50mb",
  extended: true
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/productos";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const nombre = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, nombre);
  }
});

const upload = multer({ storage });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =================================================
// 📤 SUBIR IMÁGENES DE PRODUCTOS
// =================================================
app.post("/upload-productos", upload.array("imagenes", 20), async (req, res) => {
  const imagenes = req.files.map(file =>
  `/uploads/productos/${file.filename}`

  );
  res.json(imagenes);
});

// =================================================
// 📤 SUBIR BANNER
// =================================================
app.post("/upload-banner", upload.single("imagen"), (req, res) => {
 const imagen =
`/uploads/productos/${req.file.filename}`;
});

// =================================================
// ✉️ ENVIAR COTIZACIÓN POR EMAIL (CON RESEND)
// =================================================
app.post("/enviar-cotizacion", async (req, res) => {
  try {
    const { nombre, correo, celular, producto, total, pdf } = req.body;
    
    console.log('📧 Recibida solicitud de cotización:');
    console.log(`   - Nombre: ${nombre}`);
    console.log(`   - Correo: ${correo}`);
    console.log(`   - Producto: ${producto}`);
    console.log(`   - Total: $${total}`);
    console.log(`   - Tiene PDF: ${pdf ? 'Sí' : 'No'}`);
    
    // Validar datos
    if (!nombre || !correo || !producto || !total) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos: nombre, correo, producto y total son obligatorios' 
      });
    }
    
    // Preparar el PDF
    let attachments = [];
    if (pdf) {
      try {
        let base64Data = pdf;
        if (pdf.includes('base64,')) {
          base64Data = pdf.split('base64,')[1];
        } else if (pdf.includes(',')) {
          base64Data = pdf.split(',')[1];
        }
        
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        // Resend usa attachment con diferente formato
        attachments.push({
          filename: `cotizacion_${Date.now()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        });
        console.log(`✅ PDF preparado (${pdfBuffer.length} bytes)`);
      } catch (error) {
        console.warn('⚠️ Error al procesar el PDF:', error.message);
      }
    }
    
    // HTML del correo
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #16a34a;">
          <h1 style="color: #16a34a; margin: 0;">🏠 Tienda de Pisos</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Cotización de Producto</p>
        </div>
        
        <div style="padding: 20px 0;">
          <h2 style="color: #111827;">¡Hola ${nombre}!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Gracias por solicitar una cotización. Aquí tienes los detalles:
          </p>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>📦 Producto:</strong> ${producto}</p>
            <p style="margin: 5px 0;"><strong>💰 Total estimado:</strong> $${total}</p>
            ${celular ? `<p style="margin: 5px 0;"><strong>📱 Teléfono:</strong> ${celular}</p>` : ''}
            <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> ${new Date().toLocaleDateString('es-MX')}</p>
          </div>
          
          ${attachments.length > 0 ? `
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #1e3a8a;">
                📎 Adjunto encontrarás el PDF con los detalles completos de la cotización.
              </p>
            </div>
          ` : ''}
        </div>
        
        <div style="border-top: 2px solid #e5e7eb; padding-top: 15px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">Este correo fue generado automáticamente.</p>
        </div>
      </div>
    `;

    // Enviar correo con Resend
    const emailData = {
      from: 'onboarding@resend.dev',
      to: correo,
      subject: `📄 Cotización - ${producto}`,
      html: html,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content.toString('base64'),
        contentType: att.contentType
      }))
    };
    
    const response = await resend.emails.send(emailData);
    console.log(`✅ Correo enviado correctamente - ID: ${response.id}`);
    
    res.json({ 
      success: true, 
      message: 'Cotización enviada correctamente',
      messageId: response.id 
    });
    
  } catch (error) {
    console.error('❌ Error al enviar cotización:', error);
    
    let errorMessage = 'Error al enviar el correo';
    if (error.statusCode === 429) {
      errorMessage = 'Demasiadas solicitudes. Intenta de nuevo más tarde.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// =================================================
// 📋 PEDIDOS - GENERAR NÚMERO DE PEDIDO ÚNICO
// =================================================

const generarNumeroPedido = async () => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const fechaStr = `${año}${mes}${dia}`;
  
  const [rows] = await db.query(
    "SELECT numero_pedido FROM pedidos WHERE numero_pedido LIKE ? ORDER BY id DESC LIMIT 1",
    [`PED-${fechaStr}-%`]
  );
  
  let consecutivo = 1;
  if (rows.length > 0) {
    const ultimoNumero = rows[0].numero_pedido;
    const partes = ultimoNumero.split('-');
    if (partes.length === 3) {
      consecutivo = parseInt(partes[2]) + 1;
    }
  }
  
  return `PED-${fechaStr}-${String(consecutivo).padStart(4, '0')}`;
};

// 📋 CREAR PEDIDO
app.post("/pedidos", async (req, res) => {
  try {
    const { cliente, productos, total } = req.body;
    
    if (!cliente || !cliente.nombre || !cliente.email || !cliente.celular) {
      return res.status(400).json({ error: "Datos del cliente incompletos" });
    }
    
    if (!productos || productos.length === 0) {
      return res.status(400).json({ error: "No hay productos en el pedido" });
    }
    
    const numeroPedido = await generarNumeroPedido();
    
    const sqlPedido = `
      INSERT INTO pedidos (
        numero_pedido,
        cliente_nombre,
        cliente_email,
        cliente_celular,
        cliente_comentarios,
        total,
        estado,
        fecha_pedido
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const [resultPedido] = await db.query(sqlPedido, [
      numeroPedido,
      cliente.nombre,
      cliente.email,
      cliente.celular,
      cliente.comentarios || null,
      total,
      'pendiente'
    ]);
    
    const pedidoId = resultPedido.insertId;
    
    const sqlProducto = `
      INSERT INTO pedido_productos (
        pedido_id,
        producto_id,
        nombre,
        sku,
        cantidad,
        precio,
        subtotal,
        imagen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    for (const item of productos) {
      await db.query(sqlProducto, [
        pedidoId,
        item.id || null,
        item.nombre,
        item.sku || null,
        item.cantidad,
        item.precio,
        item.subtotal,
        item.imagen || null
      ]);
    }
    
    try {
      await enviarCorreoPedido(cliente, numeroPedido, productos, total);
    } catch (emailError) {
      console.error("Error al enviar correo:", emailError);
    }
    
    res.status(201).json({
      success: true,
      mensaje: "Pedido creado exitosamente",
      numero_pedido: numeroPedido,
      pedido_id: pedidoId
    });
    
  } catch (error) {
    console.error("Error al crear pedido:", error);
    res.status(500).json({ 
      error: "Error al crear el pedido",
      details: error.message 
    });
  }
});

// 📋 OBTENER PEDIDOS (ADMIN)
app.get("/pedidos", async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.*,
        COUNT(pp.id) AS total_productos
      FROM pedidos p
      LEFT JOIN pedido_productos pp ON pp.pedido_id = p.id
      GROUP BY p.id
      ORDER BY p.id DESC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

// 📋 OBTENER PEDIDO POR ID
app.get("/pedidos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [pedido] = await db.query("SELECT * FROM pedidos WHERE id = ?", [id]);
    if (pedido.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }
    
    const [productos] = await db.query(
      "SELECT * FROM pedido_productos WHERE pedido_id = ?",
      [id]
    );
    
    res.json({
      ...pedido[0],
      productos
    });
  } catch (error) {
    console.error("Error al obtener pedido:", error);
    res.status(500).json({ error: "Error al obtener pedido" });
  }
});

// 📋 OBTENER PEDIDO POR NÚMERO DE PEDIDO
app.get("/pedidos/numero/:numero", async (req, res) => {
  try {
    const { numero } = req.params;
    
    const [pedido] = await db.query(
      "SELECT * FROM pedidos WHERE numero_pedido = ?",
      [numero]
    );
    
    if (pedido.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }
    
    const [productos] = await db.query(
      "SELECT * FROM pedido_productos WHERE pedido_id = ?",
      [pedido[0].id]
    );
    
    res.json({
      ...pedido[0],
      productos
    });
  } catch (error) {
    console.error("Error al obtener pedido:", error);
    res.status(500).json({ error: "Error al obtener pedido" });
  }
});

// 📧 FUNCIÓN PARA ENVIAR CORREO DE ACTUALIZACIÓN DE ESTADO (CON RESEND)
const enviarCorreoEstadoPedido = async (pedido, estadoAnterior, estadoNuevo) => {
  const estadoLabels = {
    pendiente: '⏳ Pendiente',
    confirmado: '✅ Confirmado',
    en_preparacion: '🔧 En preparación',
    listo: '📦 Listo para recoger',
    entregado: '🚚 Entregado',
    cancelado: '❌ Cancelado'
  };

  const mensajes = {
    confirmado: 'Tu pedido ha sido confirmado y está en proceso.',
    en_preparacion: 'Tu pedido está siendo preparado para entrega.',
    listo: '¡Tu pedido ya está listo! Puedes pasar a recogerlo a nuestra tienda.',
    entregado: 'Tu pedido ha sido entregado. ¡Gracias por confiar en Fray Flooring!',
    cancelado: 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.',
    pendiente: 'Tu pedido está pendiente de revisión.'
  };

  const [productos] = await db.query(
    "SELECT * FROM pedido_productos WHERE pedido_id = ?",
    [pedido.id]
  );

  const productosHtml = productos.map(p => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${p.nombre}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${p.cantidad}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${p.precio}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${p.subtotal}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f8fafc; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #3b82f6; }
        .header h1 { color: #1e293b; margin: 0; }
        .status-box { background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; }
        .status-box .old { color: #94a3b8; text-decoration: line-through; font-size: 16px; }
        .status-box .arrow { color: #3b82f6; font-size: 24px; margin: 0 12px; }
        .status-box .new { color: #16a34a; font-size: 24px; font-weight: 800; }
        .message { background: #eef2ff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #3b82f6; }
        .pedido-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 16px 0; }
        .pedido-info p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { background: #3b82f6; color: #fff; padding: 10px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
        .total { text-align: right; font-size: 18px; font-weight: bold; color: #3b82f6; padding-top: 15px; border-top: 2px solid #e2e8f0; }
        .footer { text-align: center; margin-top: 30px; color: #94a3b8; font-size: 14px; }
        .importante { margin-top: 16px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b; }
        .importante p { margin: 0; color: #92400e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Actualización de tu Pedido</h1>
          <p style="color: #3b82f6; font-size: 18px; font-weight: bold;">${pedido.numero_pedido}</p>
        </div>
        
        <div class="status-box">
          <span class="old">${estadoLabels[estadoAnterior] || estadoAnterior}</span>
          <span class="arrow">➜</span>
          <span class="new">${estadoLabels[estadoNuevo] || estadoNuevo}</span>
        </div>
        
        <div class="message">
          <p style="margin: 0; font-size: 16px; color: #1e293b;">
            ${mensajes[estadoNuevo] || 'El estado de tu pedido ha sido actualizado.'}
          </p>
        </div>
        
        <div class="pedido-info">
          <p><strong>👤 Cliente:</strong> ${pedido.cliente_nombre}</p>
          <p><strong>📧 Email:</strong> ${pedido.cliente_email}</p>
          <p><strong>📱 Celular:</strong> ${pedido.cliente_celular}</p>
        </div>
        
        <h3>🛒 Productos</h3>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th style="text-align: center;">Cantidad</th>
              <th style="text-align: right;">Precio</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${productosHtml}
          </tbody>
        </table>
        
        <div class="total">
          Total: $${pedido.total}
        </div>
        
        <div class="importante">
          <p>⚠️ <strong>Recuerda:</strong> Este pedido será entregado en tienda física. No realizamos envíos a domicilio.</p>
        </div>
        
        <div class="footer">
          <p>📞 <a href="tel:+525511164545" style="color: #3b82f6; text-decoration: none;">55 1116 4545</a></p>
          <p>📧 <a href="mailto:frayflooring@gmail.com" style="color: #3b82f6; text-decoration: none;">frayflooring@gmail.com</a></p>
          <p style="margin-top: 10px; font-size: 12px;">© ${new Date().getFullYear()} Fray Flooring. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: pedido.cliente_email,
      subject: `📦 Actualización de tu pedido #${pedido.numero_pedido}`,
      html: html
    });
    console.log(`✅ Correo de actualización enviado a ${pedido.cliente_email}`);
  } catch (error) {
    console.error("Error enviando correo de actualización:", error);
    throw error;
  }
};

// 📋 ACTUALIZAR ESTADO DE PEDIDO (con envío de correo)
app.put("/pedidos/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    const estadosValidos = ['pendiente', 'confirmado', 'en_preparacion', 'listo', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: "Estado no válido" });
    }
    
    const [pedidoActual] = await db.query("SELECT * FROM pedidos WHERE id = ?", [id]);
    if (pedidoActual.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }
    
    const estadoAnterior = pedidoActual[0].estado;
    
    await db.query(
      "UPDATE pedidos SET estado = ? WHERE id = ?",
      [estado, id]
    );
    
    const [pedidoActualizado] = await db.query("SELECT * FROM pedidos WHERE id = ?", [id]);
    
    if (estadoAnterior !== estado) {
      try {
        await enviarCorreoEstadoPedido(pedidoActualizado[0], estadoAnterior, estado);
      } catch (emailError) {
        console.error("Error enviando correo:", emailError);
      }
    }
    
    res.json({ 
      success: true, 
      mensaje: "Estado actualizado",
      estado_anterior: estadoAnterior,
      estado_nuevo: estado
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});

// 📧 FUNCIÓN PARA ENVIAR CORREO DE CONFIRMACIÓN (PEDIDO NUEVO CON RESEND)
const enviarCorreoPedido = async (cliente, numeroPedido, productos, total) => {
  const productosHtml = productos.map(p => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${p.nombre}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${p.cantidad}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${p.precio}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${p.subtotal}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f8fafc; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #3b82f6; }
        .header h1 { color: #1e293b; margin: 0; }
        .header .numero { color: #3b82f6; font-size: 20px; font-weight: bold; }
        .cliente-info { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .cliente-info p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #3b82f6; color: #fff; padding: 10px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
        .total { text-align: right; font-size: 20px; font-weight: bold; color: #3b82f6; padding-top: 15px; border-top: 2px solid #e2e8f0; }
        .footer { text-align: center; margin-top: 30px; color: #94a3b8; font-size: 14px; }
        .estado { display: inline-block; background: #f59e0b; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
        .importante { margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b; }
        .importante p { margin: 0; color: #92400e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏷️ Confirmación de Pedido</h1>
          <p class="numero">Número de Pedido: <strong>${numeroPedido}</strong></p>
          <span class="estado">📌 Pendiente</span>
        </div>
        
        <div class="cliente-info">
          <p><strong>👤 Cliente:</strong> ${cliente.nombre}</p>
          <p><strong>📧 Email:</strong> ${cliente.email}</p>
          <p><strong>📱 Celular:</strong> ${cliente.celular}</p>
          ${cliente.comentarios ? `<p><strong>💬 Comentarios:</strong> ${cliente.comentarios}</p>` : ''}
        </div>
        
        <h3>🛒 Productos</h3>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th style="text-align: center;">Cantidad</th>
              <th style="text-align: right;">Precio</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${productosHtml}
          </tbody>
        </table>
        
        <div class="total">
          Total: $${total}
        </div>
        
        <div class="importante">
          <p>⚠️ <strong>Importante:</strong> Este pedido será entregado directamente en tienda física. No se realizan envíos a domicilio.</p>
        </div>
        
        <div class="footer">
          <p>📞 <a href="tel:+525511164545" style="color: #3b82f6; text-decoration: none;">55 1116 4545</a></p>
          <p>📧 <a href="mailto:frayflooring@gmail.com" style="color: #3b82f6; text-decoration: none;">frayflooring@gmail.com</a></p>
          <p style="margin-top: 10px; font-size: 12px;">© ${new Date().getFullYear()} Fray Flooring. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: cliente.email,
      subject: `Confirmación de Pedido #${numeroPedido}`,
      html: html
    });
    console.log(`✅ Correo de confirmación enviado a ${cliente.email}`);
  } catch (error) {
    console.error("Error enviando correo:", error);
    throw error;
  }
};

// =================================================
// 📋 OBTENER TODOS LOS PRODUCTOS (PÚBLICO)
// =================================================
app.get("/productos", async (req, res) => {
  try {
    const sql = `
      SELECT 
        productos.*,
        categorias.nombre AS categoria,
        subcategorias.nombre AS subcategoria,
        tipos.nombre AS tipo
      FROM productos
      LEFT JOIN categorias ON categorias.id = productos.categoria_id
      LEFT JOIN subcategorias ON subcategorias.id = productos.subcategoria_id
      LEFT JOIN tipos ON tipos.id = productos.tipo_id
      WHERE productos.visible = 1
      ORDER BY productos.nombre ASC
    `;
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// =================================================
// 📋 OBTENER TODOS LOS PRODUCTOS (ADMIN)
// =================================================
app.get("/admin/productos", async (req, res) => {
  try {
    const sql = `
      SELECT 
        productos.*,
        categorias.nombre AS categoria,
        subcategorias.nombre AS subcategoria,
        tipos.nombre AS tipo
      FROM productos
      LEFT JOIN categorias ON categorias.id = productos.categoria_id
      LEFT JOIN subcategorias ON subcategorias.id = productos.subcategoria_id
      LEFT JOIN tipos ON tipos.id = productos.tipo_id
      ORDER BY productos.id DESC
    `;
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// =================================================
// ⭐ PRODUCTOS DESTACADOS
// =================================================
app.get("/productos/destacados", async (req, res) => {
  try {
    const sql = `
      SELECT 
        productos.*,
        categorias.nombre AS categoria,
        subcategorias.nombre AS subcategoria,
        tipos.nombre AS tipo
      FROM productos
      LEFT JOIN categorias ON categorias.id = productos.categoria_id
      LEFT JOIN subcategorias ON subcategorias.id = productos.subcategoria_id
      LEFT JOIN tipos ON tipos.id = productos.tipo_id
      WHERE productos.destacado = 1 AND productos.visible = 1
      ORDER BY productos.nombre ASC
    `;
    const [result] = await db.query(sql);
    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// =================================================
// 🟡 PRODUCTOS POR CATEGORÍA (ID)
// =================================================
app.get("/productos/categoria-id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Buscando productos para categoría ID: ${id}`);
    
    const [catCheck] = await db.query("SELECT id FROM categorias WHERE id = ?", [id]);
    if (catCheck.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    const sql = `
      SELECT 
        productos.*,
        categorias.nombre AS categoria_nombre,
        subcategorias.nombre AS subcategoria_nombre,
        tipos.nombre AS tipo_nombre
      FROM productos
      LEFT JOIN categorias ON categorias.id = productos.categoria_id
      LEFT JOIN subcategorias ON subcategorias.id = productos.subcategoria_id
      LEFT JOIN tipos ON tipos.id = productos.tipo_id
      WHERE productos.categoria_id = ? AND productos.visible = 1
      ORDER BY productos.nombre ASC
    `;
    const [result] = await db.query(sql, [id]);
    console.log(`✅ Encontrados ${result.length} productos`);
    res.json(result);
  } catch (err) {
    console.error('❌ Error en /productos/categoria-id/:id:', err);
    res.status(500).json({ error: "Error al obtener productos por categoría" });
  }
});

// =================================================
// 🟡 PRODUCTOS POR CATEGORÍA (NOMBRE)
// =================================================
app.get("/productos/categoria/:nombre", async (req, res) => {
  try {
    const { nombre } = req.params;
    const sql = `
      SELECT 
        productos.*,
        categorias.nombre AS categoria,
        subcategorias.nombre AS subcategoria,
        tipos.nombre AS tipo
      FROM productos
      LEFT JOIN categorias ON categorias.id = productos.categoria_id
      LEFT JOIN subcategorias ON subcategorias.id = productos.subcategoria_id
      LEFT JOIN tipos ON tipos.id = productos.tipo_id
      WHERE LOWER(categorias.nombre) = LOWER(?) AND productos.visible = 1
      ORDER BY productos.nombre ASC
    `;
    const [result] = await db.query(sql, [nombre]);
    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// =================================================
// 🔥 PRODUCTOS POR SUBCATEGORÍA (NOMBRE)
// =================================================
app.get("/productos/subcategoria/:nombre", async (req, res) => {
  try {
    const { nombre } = req.params;
    const sql = `
      SELECT 
        productos.*,
        categorias.nombre AS categoria,
        subcategorias.nombre AS subcategoria,
        tipos.nombre AS tipo
      FROM productos
      INNER JOIN subcategorias ON productos.subcategoria_id = subcategorias.id
      LEFT JOIN categorias ON categorias.id = productos.categoria_id
      LEFT JOIN tipos ON tipos.id = productos.tipo_id
      WHERE subcategorias.nombre = ? AND productos.visible = 1
      ORDER BY productos.nombre ASC
    `;
    const [rows] = await db.query(sql, [nombre]);
    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

// =================================================
// 🔥 PRODUCTOS POR SUBCATEGORÍA (ID)
// =================================================
app.get("/productos/subcategoria-id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Buscando productos para subcategoría ID: ${id}`);
    
    const [subCheck] = await db.query("SELECT id FROM subcategorias WHERE id = ?", [id]);
    if (subCheck.length === 0) {
      return res.status(404).json({ error: "Subcategoría no encontrada" });
    }
    
    const sql = `
      SELECT 
        productos.*,
        categorias.nombre AS categoria_nombre,
        subcategorias.nombre AS subcategoria_nombre,
        tipos.nombre AS tipo_nombre
      FROM productos
      INNER JOIN subcategorias ON productos.subcategoria_id = subcategorias.id
      LEFT JOIN categorias ON categorias.id = productos.categoria_id
      LEFT JOIN tipos ON tipos.id = productos.tipo_id
      WHERE subcategorias.id = ? AND productos.visible = 1
      ORDER BY productos.nombre ASC
    `;
    const [rows] = await db.query(sql, [id]);
    console.log(`✅ Encontrados ${rows.length} productos`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error en /productos/subcategoria-id/:id:', error);
    res.status(500).json({ error: "Error al obtener productos por subcategoría" });
  }
});

// =================================================
// 🟣 PRODUCTOS POR TIPO (ID)
// =================================================
app.get("/productos/tipo/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Buscando productos con tipo_id = ${id}`);
    
    const [tipoCheck] = await db.query("SELECT id FROM tipos WHERE id = ?", [id]);
    if (tipoCheck.length === 0) {
      return res.status(404).json({ error: "Tipo no encontrado" });
    }

    const sql = `
      SELECT 
        productos.*,
        categorias.nombre AS categoria_nombre,
        subcategorias.nombre AS subcategoria_nombre,
        tipos.nombre AS tipo_nombre
      FROM productos
      LEFT JOIN categorias ON categorias.id = productos.categoria_id
      LEFT JOIN subcategorias ON subcategorias.id = productos.subcategoria_id
      LEFT JOIN tipos ON tipos.id = productos.tipo_id
      WHERE productos.tipo_id = ? AND productos.visible = 1
      ORDER BY productos.nombre ASC
    `;

    const [result] = await db.query(sql, [id]);
    console.log(`✅ Encontrados ${result.length} productos`);
    res.json(result);
  } catch (err) {
    console.error("❌ Error en /productos/tipo/:id", err);
    res.status(500).json({ error: "Error al obtener productos por tipo" });
  }
});

// =================================================
// 🔥 PRODUCTOS POR TIPO (NOMBRE)
// =================================================
app.get("/productos/tipo-nombre/:nombre", async (req, res) => {
  try {
    const { nombre } = req.params;
    console.log(`🔍 Buscando productos con tipo: ${nombre}`);
    
    const sql = `
      SELECT 
        productos.*,
        categorias.nombre AS categoria_nombre,
        subcategorias.nombre AS subcategoria_nombre,
        tipos.nombre AS tipo_nombre
      FROM productos
      LEFT JOIN categorias ON categorias.id = productos.categoria_id
      LEFT JOIN subcategorias ON subcategorias.id = productos.subcategoria_id
      LEFT JOIN tipos ON tipos.id = productos.tipo_id
      WHERE LOWER(tipos.nombre) = LOWER(?) AND productos.visible = 1
      ORDER BY productos.nombre ASC
    `;

    const [result] = await db.query(sql, [nombre]);
    console.log(`✅ Encontrados ${result.length} productos`);
    res.json(result);
  } catch (err) {
    console.error("❌ Error en /productos/tipo-nombre/:nombre", err);
    res.status(500).json({ error: "Error al obtener productos por tipo" });
  }
});

// =================================================
// 🟢 FILTRAR PRODUCTOS POR CATEGORÍA, SUBCATEGORÍA Y TIPO
// =================================================
app.get("/productos/filtro", async (req, res) => {
  try {
    const { categoria_id, subcategoria_id, tipo_id } = req.query;
    
    console.log(`🔍 Filtrando productos: categoria=${categoria_id}, subcategoria=${subcategoria_id}, tipo=${tipo_id}`);
    
    let sql = `
      SELECT 
        productos.*,
        categorias.nombre AS categoria_nombre,
        subcategorias.nombre AS subcategoria_nombre,
        tipos.nombre AS tipo_nombre
      FROM productos
      LEFT JOIN categorias ON categorias.id = productos.categoria_id
      LEFT JOIN subcategorias ON subcategorias.id = productos.subcategoria_id
      LEFT JOIN tipos ON tipos.id = productos.tipo_id
      WHERE productos.visible = 1
    `;
    
    const condiciones = [];
    const valores = [];
    
    if (categoria_id && categoria_id !== 'undefined' && categoria_id !== 'null') {
      condiciones.push('productos.categoria_id = ?');
      valores.push(categoria_id);
    }
    
    if (subcategoria_id && subcategoria_id !== 'undefined' && subcategoria_id !== 'null') {
      condiciones.push('productos.subcategoria_id = ?');
      valores.push(subcategoria_id);
    }
    
    if (tipo_id && tipo_id !== 'undefined' && tipo_id !== 'null') {
      condiciones.push('productos.tipo_id = ?');
      valores.push(tipo_id);
    }
    
    if (condiciones.length > 0) {
      sql += ' AND ' + condiciones.join(' AND ');
    }
    
    sql += ' ORDER BY productos.nombre ASC';
    
    console.log(`📝 SQL: ${sql}`);
    console.log(`📊 Valores: ${valores}`);
    
    const [result] = await db.query(sql, valores);
    
    console.log(`✅ Encontrados ${result.length} productos`);
    res.json(result);
    
  } catch (err) {
    console.error('❌ Error en /productos/filtro:', err);
    res.status(500).json({ 
      error: "Error al filtrar productos",
      details: err.message 
    });
  }
});

// =================================================
// 📂 OBTENER TIPO POR ID
// =================================================
app.get("/tipos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        tipos.*,
        subcategorias.nombre AS subcategoria,
        categorias.nombre AS categoria
      FROM tipos
      LEFT JOIN subcategorias ON subcategorias.id = tipos.subcategoria_id
      LEFT JOIN categorias ON categorias.id = subcategorias.categoria_id
      WHERE tipos.id = ?
    `;
    const [rows] = await db.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Tipo no encontrado" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error al obtener tipo" });
  }
});

// =================================================
// 📂 OBTENER SUBCATEGORÍA POR ID
// =================================================
app.get("/subcategorias/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Buscando subcategoría ID: ${id}`);
    
    const sql = `
      SELECT 
        subcategorias.*,
        categorias.nombre AS categoria_nombre
      FROM subcategorias
      LEFT JOIN categorias ON categorias.id = subcategorias.categoria_id
      WHERE subcategorias.id = ?
    `;
    const [rows] = await db.query(sql, [id]);
    
    if (rows.length === 0) {
      console.log(`❌ Subcategoría ID ${id} no encontrada`);
      return res.status(404).json({ error: "Subcategoría no encontrada" });
    }
    
    console.log(`✅ Subcategoría encontrada: ${rows[0].nombre}`);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error en /subcategorias/:id:', error);
    res.status(500).json({ error: "Error al obtener subcategoría" });
  }
});

// =================================================
// 🟣 OBTENER PRODUCTO POR ID
// =================================================
app.get("/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        productos.*,
        categorias.nombre AS categoria,
        subcategorias.nombre AS subcategoria,
        tipos.nombre AS tipo
      FROM productos
      LEFT JOIN categorias ON categorias.id = productos.categoria_id
      LEFT JOIN subcategorias ON subcategorias.id = productos.subcategoria_id
      LEFT JOIN tipos ON tipos.id = productos.tipo_id
      WHERE productos.id = ?
    `;
    const [result] = await db.query(sql, [id]);
    res.json(result[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// =================================================
// ➕ CREAR PRODUCTO
// =================================================
app.post("/productos", async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      precio,
      precioOferta,
      oferta,
      rebaja,
      stock,
      imagenes,
      categoria_id,
      subcategoria_id,
      tipo_id,
      destacado,
      nuevo,
      sugerencias,
      fichaTecnica,
      sku,
      tipoProducto,
      presentacion,
      ancho,
      alto,
      grueso,
      cobertura,
      tipoVenta,
      piezasCaja,
      tipoCobertura,
      especificaciones,
      informacionAdicional,
      variante,
      uso,
      aplicacion,
      tipo_diseno,
      material,
      acabado,
      tipo_instalacion,
      espesor_capa_desgaste
    } = req.body;

    const sql = `
      INSERT INTO productos (
        nombre, descripcion, precio, precioOferta, oferta, rebaja,
        stock, imagenes, categoria_id, subcategoria_id, tipo_id,
        destacado, nuevo, sugerencias, fichaTecnica, sku,
        tipoProducto, presentacion, ancho, alto, grueso,
        cobertura, piezasCaja, tipoVenta, tipoCobertura,
        especificaciones, informacionAdicional, variante,
        uso, aplicacion, tipo_diseno, material, acabado,
        tipo_instalacion, espesor_capa_desgaste
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      nombre, descripcion, precio, precioOferta, oferta ? 1 : 0, rebaja ? 1 : 0,
      stock, imagenes, categoria_id, subcategoria_id, tipo_id,
      destacado ? 1 : 0, nuevo ? 1 : 0, JSON.stringify(sugerencias || []), fichaTecnica, sku,
      tipoProducto, presentacion, ancho, alto, grueso,
      cobertura, piezasCaja, tipoVenta, tipoCobertura,
      especificaciones, informacionAdicional, variante,
      uso, aplicacion, tipo_diseno, material, acabado,
      tipo_instalacion, espesor_capa_desgaste
    ];

    const [result] = await db.query(sql, values);
    res.json({ mensaje: "Producto creado", id: result.insertId });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error al crear producto" });
  }
});

// =================================================
// ✏️ ACTUALIZAR PRODUCTO
// =================================================
app.put("/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre, descripcion, precio, precioOferta, oferta, rebaja,
      stock, imagenes, categoria_id, subcategoria_id, tipo_id,
      destacado, nuevo, sugerencias, fichaTecnica, sku,
      tipoProducto, presentacion, ancho, alto, grueso,
      cobertura, piezasCaja, tipoVenta, tipoCobertura,
      especificaciones, informacionAdicional, variante,
      uso, aplicacion, tipo_diseno, material, acabado,
      tipo_instalacion, espesor_capa_desgaste
    } = req.body;

    let imagenesFinal = imagenes;
    if (imagenesFinal === undefined || imagenesFinal === null) {
      const [rows] = await db.query("SELECT imagenes FROM productos WHERE id = ?", [id]);
      imagenesFinal = rows[0]?.imagenes || '';
    } else if (Array.isArray(imagenesFinal)) {
      imagenesFinal = imagenesFinal.join(",");
    } else if (typeof imagenesFinal === 'string') {
      const trimmed = imagenesFinal.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            imagenesFinal = parsed.join(",");
          }
        } catch (e) {}
      }
    }

    const sql = `
      UPDATE productos SET
        nombre=?, descripcion=?, precio=?, precioOferta=?, oferta=?, rebaja=?,
        stock=?, imagenes=?, categoria_id=?, subcategoria_id=?, tipo_id=?,
        destacado=?, nuevo=?, sugerencias=?, fichaTecnica=?,
        sku=?, tipoProducto=?, presentacion=?, ancho=?, alto=?, grueso=?,
        cobertura=?, piezasCaja=?, tipoVenta=?, tipoCobertura=?,
        especificaciones=?, informacionAdicional=?, variante=?,
        uso=?, aplicacion=?, tipo_diseno=?, material=?, acabado=?,
        tipo_instalacion=?, espesor_capa_desgaste=?
      WHERE id=?
    `;

    const values = [
      nombre, descripcion, precio, precioOferta, oferta ? 1 : 0, rebaja ? 1 : 0,
      stock, imagenesFinal, categoria_id, subcategoria_id, tipo_id,
      destacado ? 1 : 0, nuevo ? 1 : 0, JSON.stringify(sugerencias || []), fichaTecnica,
      sku, tipoProducto, presentacion, ancho, alto, grueso,
      cobertura, piezasCaja, tipoVenta, tipoCobertura,
      especificaciones, informacionAdicional, variante,
      uso, aplicacion, tipo_diseno, material, acabado,
      tipo_instalacion, espesor_capa_desgaste,
      id
    ];

    await db.query(sql, values);
    res.json({ mensaje: "Producto actualizado" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error al actualizar" });
  }
});

// =================================================
// 🔴 ELIMINAR PRODUCTO
// =================================================
app.delete("/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM productos WHERE id=?", [id]);
    res.json({ message: "Producto eliminado" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// =================================================
// 👁️ CAMBIAR VISIBILIDAD DEL PRODUCTO
// =================================================
app.put("/productos/:id/visible", async (req, res) => {
  const { id } = req.params;
  const { visible } = req.body;
  try {
    await db.query("UPDATE productos SET visible = ? WHERE id = ?", [visible, id]);
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error" });
  }
});

// =================================================
// 📋 BANNERS
// =================================================
app.get("/banners", async (req, res) => {
  try {
    const [result] = await db.query("SELECT * FROM banners ORDER BY id DESC");
    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.post("/banners", async (req, res) => {
  try {
    const { titulo, descripcion, imagen, categoria, subcategoria } = req.body;
    const sql = `INSERT INTO banners (titulo, descripcion, imagen, categoria, subcategoria) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await db.query(sql, [titulo, descripcion, imagen, categoria, subcategoria]);
    res.json({ message: "Banner creado", id: result.insertId });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error al crear banner" });
  }
});

app.delete("/banners/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM banners WHERE id = ?", [req.params.id]);
    res.json({ message: "Banner eliminado" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// =================================================
// 🔥 CATEGORÍAS DESTACADAS
// =================================================
app.get("/categorias-destacadas", async (req, res) => {
  try {
    const sql = `
      SELECT 
        categorias.id AS categoria_id,
        categorias.nombre AS categoria,
        MIN(productos.imagenes) AS imagenes
      FROM categorias
      LEFT JOIN productos ON productos.categoria_id = categorias.id
      WHERE categorias.destacada = 1
      GROUP BY categorias.id, categorias.nombre
    `;
    const [result] = await db.query(sql);
    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// =================================================
// 📂 CATEGORÍAS
// =================================================
app.get("/categorias", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM categorias ORDER BY nombre ASC");
    res.json(results);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.post("/categorias", async (req, res) => {
  try {
    const { nombre } = req.body;
    const [result] = await db.query("INSERT INTO categorias(nombre) VALUES(?)", [nombre]);
    res.json({ id: result.insertId, nombre });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.put("/categorias/:id", async (req, res) => {
  try {
    const { nombre, destacada } = req.body;
    if (nombre !== undefined) {
      await db.query("UPDATE categorias SET nombre = ? WHERE id = ?", [nombre, req.params.id]);
    }
    if (destacada !== undefined) {
      await db.query("UPDATE categorias SET destacada = ? WHERE id = ?", [destacada, req.params.id]);
    }
    res.json({ message: "Categoría actualizada" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.delete("/categorias/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM categorias WHERE id = ?", [req.params.id]);
    res.json({ message: "Categoría eliminada" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// =================================================
// 📂 SUBCATEGORÍAS
// =================================================
app.get("/subcategorias", async (req, res) => {
  try {
    const sql = `
      SELECT 
        subcategorias.*,
        categorias.nombre AS categoria
      FROM subcategorias
      LEFT JOIN categorias ON categorias.id = subcategorias.categoria_id
      ORDER BY subcategorias.nombre ASC
    `;
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.post("/subcategorias", async (req, res) => {
  try {
    const { nombre, categoria_id } = req.body;
    const [result] = await db.query(
      "INSERT INTO subcategorias (nombre, categoria_id) VALUES(?, ?)",
      [nombre, categoria_id]
    );
    res.json({ id: result.insertId, nombre });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.put("/subcategorias/:id", async (req, res) => {
  try {
    await db.query("UPDATE subcategorias SET nombre = ? WHERE id = ?", [
      req.body.nombre,
      req.params.id
    ]);
    res.json({ message: "Subcategoría actualizada" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.delete("/subcategorias/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM subcategorias WHERE id = ?", [req.params.id]);
    res.json({ message: "Subcategoría eliminada" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// =================================================
// 📂 TIPOS
// =================================================
app.get("/tipos", async (req, res) => {
  try {
    const sql = `
      SELECT 
        tipos.*,
        subcategorias.nombre AS subcategoria,
        categorias.nombre AS categoria,
        categorias.id AS categoria_id
      FROM tipos
      LEFT JOIN subcategorias ON subcategorias.id = tipos.subcategoria_id
      LEFT JOIN categorias ON categorias.id = subcategorias.categoria_id
      ORDER BY tipos.nombre ASC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.post("/tipos", async (req, res) => {
  try {
    const { nombre, subcategoria_id } = req.body;
    if (!nombre || !subcategoria_id) {
      return res.status(400).json({ error: "Faltan datos" });
    }
    const [result] = await db.query(
      "INSERT INTO tipos (nombre, subcategoria_id) VALUES (?, ?)",
      [nombre, subcategoria_id]
    );
    res.json({ id: result.insertId, nombre, subcategoria_id });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error al crear tipo" });
  }
});

app.put("/tipos/:id", async (req, res) => {
  try {
    const { nombre, subcategoria_id } = req.body;
    const { id } = req.params;
    await db.query(
      "UPDATE tipos SET nombre = ?, subcategoria_id = ? WHERE id = ?",
      [nombre, subcategoria_id, id]
    );
    res.json({ message: "Tipo actualizado" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error al actualizar tipo" });
  }
});

app.delete("/tipos/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM tipos WHERE id = ?", [req.params.id]);
    res.json({ message: "Tipo eliminado" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error al eliminar tipo" });
  }
});

// =================================================
// 📤 SUBIR FICHA TÉCNICA
// =================================================
const storageFicha = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/fichas";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const nombre = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, nombre);
  }
});

const uploadFicha = multer({ storage: storageFicha });

app.post("/upload-ficha", uploadFicha.single("ficha"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió archivo" });
    }
  const url =
`/uploads/fichas/${req.file.filename}`;
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al subir ficha" });
  }
});

// =================================================
// 🌀 DUPLICAR PRODUCTO CON COPIA FÍSICA DE IMÁGENES
// =================================================
app.post("/productos/:id/duplicar", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM productos WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });
    const original = rows[0];

    let nuevasImagenes = [];
    if (original.imagenes) {
      let imagenesArray = [];
      const trimmed = original.imagenes.trim();
      if (trimmed.startsWith('[')) {
        try { imagenesArray = JSON.parse(trimmed); } catch {}
      } else {
        imagenesArray = original.imagenes.split(',').map(url => url.trim());
      }

      const uploadDir = path.join(__dirname, 'uploads/productos');
      for (let url of imagenesArray) {
        const filename = url.split('/').pop();
        const srcPath = path.join(uploadDir, filename);
        try {
          await fs.promises.access(srcPath);
        } catch {
          console.warn(`Archivo no encontrado: ${srcPath}`);
          continue;
        }
        const ext = path.extname(filename);
        const baseName = path.basename(filename, ext);
        const newFilename = `${Date.now()}-${baseName}${ext}`;
        const destPath = path.join(uploadDir, newFilename);
        await fs.promises.copyFile(srcPath, destPath);
        const newUrl =
`/uploads/productos/${newFilename}`;
        nuevasImagenes.push(newUrl);
      }
    }

    const nuevasImagenesString = nuevasImagenes.join(",");

    const nuevoProducto = {
      ...original,
      id: undefined,
      imagenes: nuevasImagenesString,
      nombre: original.nombre + " (copia)",
    };

    const [result] = await db.query("INSERT INTO productos SET ?", [nuevoProducto]);
    const nuevoId = result.insertId;

    const [newRows] = await db.query(`
      SELECT 
        productos.*,
        categorias.nombre AS categoria,
        subcategorias.nombre AS subcategoria,
        tipos.nombre AS tipo
      FROM productos
      LEFT JOIN categorias ON categorias.id = productos.categoria_id
      LEFT JOIN subcategorias ON subcategorias.id = productos.subcategoria_id
      LEFT JOIN tipos ON tipos.id = productos.tipo_id
      WHERE productos.id = ?
    `, [nuevoId]);

    res.json(newRows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al duplicar producto", details: err.message });
  }
});

// =================================================
// 🏷️ BANNERS DE OFERTAS ESPECIALES
// =================================================
const storageBannerOferta = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/banners-ofertas";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const nombre = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, nombre);
  }
});

const uploadBannerOferta = multer({
  storage: storageBannerOferta,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, png, webp, jpg, gif)'), false);
    }
  }
});

app.get("/banners-ofertas", async (req, res) => {
  try {
    const sql = `
      SELECT * FROM banners_ofertas 
      WHERE activo = 1 
      ORDER BY orden ASC, creado_en DESC
    `;
    const [rows] = await db.query(sql);
    
    for (let banner of rows) {
      if (banner.enlace_tipo === 'categoria' && banner.categoria_id) {
        const [categoria] = await db.query('SELECT nombre FROM categorias WHERE id = ?', [banner.categoria_id]);
        banner.categoria_nombre = categoria[0]?.nombre || null;
      } else if (banner.enlace_tipo === 'subcategoria' && banner.subcategoria_id) {
        const [subcategoria] = await db.query('SELECT nombre FROM subcategorias WHERE id = ?', [banner.subcategoria_id]);
        banner.subcategoria_nombre = subcategoria[0]?.nombre || null;
      } else if (banner.enlace_tipo === 'tipo' && banner.tipo_id) {
        const [tipo] = await db.query('SELECT nombre FROM tipos WHERE id = ?', [banner.tipo_id]);
        banner.tipo_nombre = tipo[0]?.nombre || null;
      } else if (banner.enlace_tipo === 'producto' && banner.producto_id) {
        const [producto] = await db.query('SELECT nombre, sku FROM productos WHERE id = ?', [banner.producto_id]);
        banner.producto_nombre = producto[0]?.nombre || null;
        banner.producto_sku = producto[0]?.sku || null;
      }
    }
    
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener banners de ofertas:', err);
    res.status(500).json({ error: 'Error al obtener banners de ofertas' });
  }
});

app.get("/banners-ofertas/:id", async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM banners_ofertas WHERE id = ? AND activo = 1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Banner de oferta no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al obtener banner de oferta:', err);
    res.status(500).json({ error: 'Error al obtener banner de oferta' });
  }
});

app.post("/banners-ofertas", async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      imagen,
      porcentaje,
      enlace_tipo,
      categoria_id,
      subcategoria_id,
      tipo_id,
      producto_id,
      url_externa,
      orden
    } = req.body;

    if (!titulo || !imagen) {
      return res.status(400).json({ error: 'Título e imagen son requeridos' });
    }

    const sql = `
      INSERT INTO banners_ofertas (
        titulo, descripcion, imagen, porcentaje, enlace_tipo,
        categoria_id, subcategoria_id, tipo_id, producto_id,
        url_externa, orden
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      titulo,
      descripcion || null,
      imagen,
      porcentaje || null,
      enlace_tipo || 'categoria',
      categoria_id || null,
      subcategoria_id || null,
      tipo_id || null,
      producto_id || null,
      url_externa || null,
      orden || 1
    ]);

    const [newBanner] = await db.query('SELECT * FROM banners_ofertas WHERE id = ?', [result.insertId]);
    res.status(201).json(newBanner[0]);
  } catch (err) {
    console.error('Error al crear banner de oferta:', err);
    res.status(500).json({ error: 'Error al crear banner de oferta' });
  }
});

app.put("/banners-ofertas/:id", async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      imagen,
      porcentaje,
      enlace_tipo,
      categoria_id,
      subcategoria_id,
      tipo_id,
      producto_id,
      url_externa,
      orden,
      activo
    } = req.body;

    const [existing] = await db.query('SELECT * FROM banners_ofertas WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Banner de oferta no encontrado' });
    }

    const sql = `
      UPDATE banners_ofertas SET
        titulo = ?,
        descripcion = ?,
        imagen = ?,
        porcentaje = ?,
        enlace_tipo = ?,
        categoria_id = ?,
        subcategoria_id = ?,
        tipo_id = ?,
        producto_id = ?,
        url_externa = ?,
        orden = ?,
        activo = ?
      WHERE id = ?
    `;

    await db.query(sql, [
      titulo || existing[0].titulo,
      descripcion || existing[0].descripcion,
      imagen || existing[0].imagen,
      porcentaje || existing[0].porcentaje,
      enlace_tipo || existing[0].enlace_tipo,
      categoria_id || existing[0].categoria_id,
      subcategoria_id || existing[0].subcategoria_id,
      tipo_id || existing[0].tipo_id,
      producto_id || existing[0].producto_id,
      url_externa || existing[0].url_externa,
      orden || existing[0].orden,
      activo !== undefined ? activo : existing[0].activo,
      req.params.id
    ]);

    const [updatedBanner] = await db.query('SELECT * FROM banners_ofertas WHERE id = ?', [req.params.id]);
    res.json(updatedBanner[0]);
  } catch (err) {
    console.error('Error al actualizar banner de oferta:', err);
    res.status(500).json({ error: 'Error al actualizar banner de oferta' });
  }
});

app.delete("/banners-ofertas/:id", async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM banners_ofertas WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Banner de oferta no encontrado' });
    }

    await db.query('UPDATE banners_ofertas SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Banner de oferta eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar banner de oferta:', err);
    res.status(500).json({ error: 'Error al eliminar banner de oferta' });
  }
});

app.post("/upload-banner-oferta", uploadBannerOferta.single("imagen"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }
  const imagen =
`/uploads/banners-ofertas/${req.file.filename}`;
    res.json({ imagen });
  } catch (err) {
    console.error('Error al subir imagen:', err);
    res.status(500).json({ error: 'Error al subir imagen' });
  }
});

app.get("/banners-ofertas/public/active", async (req, res) => {
  try {
    const sql = `
      SELECT 
        bo.*,
        c.nombre AS categoria_nombre,
        sc.nombre AS subcategoria_nombre,
        t.nombre AS tipo_nombre,
        p.nombre AS producto_nombre,
        p.sku AS producto_sku
      FROM banners_ofertas bo
      LEFT JOIN categorias c ON c.id = bo.categoria_id
      LEFT JOIN subcategorias sc ON sc.id = bo.subcategoria_id
      LEFT JOIN tipos t ON t.id = bo.tipo_id
      LEFT JOIN productos p ON p.id = bo.producto_id
      WHERE bo.activo = 1 
      ORDER BY bo.orden ASC, bo.creado_en DESC
      LIMIT 10
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener banners de ofertas activos:', err);
    res.status(500).json({ error: 'Error al obtener banners de ofertas' });
  }
});

// =================================================
// 📋 CONTACTOS
// =================================================
app.post("/contactos", async (req, res) => {
  try {
    const { nombre, correo, telefono, empresa, mensaje } = req.body;
    await db.query(
      `INSERT INTO contactos (nombre, correo, telefono, empresa, mensaje)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, correo, telefono, empresa, mensaje]
    );
    res.json({ success: true, mensaje: "Mensaje enviado" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error al guardar" });
  }
});

app.get("/contactos", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM contactos ORDER BY id DESC");
    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

app.delete("/contactos/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM contactos WHERE id = ?", [req.params.id]);
    res.json({ mensaje: "Eliminado" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// =================================================
// 🖼️ PROXY PARA IMÁGENES
// =================================================
const axios = require("axios");

app.get("/proxy-image", async (req, res) => {
  try {
    const imageUrl = req.query.url;
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.set("Content-Type", response.headers.get("content-type"));
    res.send(buffer);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error cargando imagen");
  }
});

// =================================================
// 🗑️ ELIMINAR PEDIDO
// =================================================
app.delete("/pedidos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [pedido] = await db.query("SELECT * FROM pedidos WHERE id = ?", [id]);
    if (pedido.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }
    
    await db.query("DELETE FROM pedidos WHERE id = ?", [id]);
    
    res.json({ 
      success: true, 
      mensaje: "Pedido eliminado correctamente" 
    });
  } catch (error) {
    console.error("Error al eliminar pedido:", error);
    res.status(500).json({ 
      error: "Error al eliminar el pedido",
      details: error.message 
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    mensaje: "Backend funcionando correctamente 🚀",
    estado: "online"
  });
});

// =================================================
// 🚀 INICIAR SERVIDOR
// =================================================
app.listen(5000, () => {
  console.log("✅ Servidor corriendo en puerto 5000");
  console.log("📋 Endpoints disponibles:");
  console.log("  - GET  /productos");
  console.log("  - GET  /productos/filtro?categoria_id=&subcategoria_id=&tipo_id=");
  console.log("  - GET  /productos/categoria-id/:id");
  console.log("  - GET  /productos/subcategoria-id/:id");
  console.log("  - GET  /productos/tipo/:id");
  console.log("  - GET  /productos/tipo-nombre/:nombre");
  console.log("  - GET  /categorias");
  console.log("  - GET  /subcategorias");
  console.log("  - GET  /tipos");
  console.log("  - GET  /banners-ofertas");
  console.log("  - POST /pedidos");
  console.log("  - GET  /pedidos");
  console.log("  - PUT  /pedidos/:id/estado (con envío de correo)");
});