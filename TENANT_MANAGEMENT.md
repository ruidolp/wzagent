# Guía de Gestión de Tenants y Webhooks

## Nuevas Funcionalidades Agregadas

### 1. Editar Tenants y Credenciales de WhatsApp

Ahora puedes editar los tenants y actualizar las credenciales de WhatsApp que expiran periódicamente.

**Cómo acceder:**
1. Ve a `/admin/tenants`
2. Haz clic en el botón **"Edit"** del tenant que quieres modificar
3. Actualiza los siguientes campos:
   - **Access Token**: Token de la API de WhatsApp (se obtiene de Meta Business Suite)
   - **Phone Number ID**: ID del número de teléfono
   - **Business Account ID**: ID de la cuenta de negocio

**Nota:** El Access Token de WhatsApp expira periódicamente. Cuando esto ocurra, simplemente actualízalo desde esta página.

### 2. Monitoreo de Webhooks en Tiempo Real

Se agregó una página para monitorear todos los webhooks que llegan de Meta WhatsApp.

**Cómo acceder:**
1. Ve a `/admin/tenants`
2. Haz clic en el botón **"📊 Webhook Logs"**
3. La página se actualiza automáticamente cada 5 segundos

**Información que puedes ver:**
- ✅ Todos los webhooks recibidos en tiempo real
- 💬 Mensajes entrantes con el contenido completo
- 📊 Actualizaciones de estado de mensajes (enviado, entregado, leído)
- ⚠️ Errores en el procesamiento de webhooks
- 📦 Contenido completo del JSON del webhook

### 3. Logging Mejorado en Consola

Ahora cuando llegan webhooks de Meta, verás en la consola logs muy claros:

```
🔔 ===============================================
🔔 WEBHOOK RECEIVED from Meta WhatsApp
🔔 ===============================================
📱 Tenant ID: abc123...
📦 Body: {...}
🔔 ===============================================
```

Cuando se procesa un mensaje:
```
💬 ===============================================
💬 PROCESSING INCOMING MESSAGE
💬 ===============================================
👤 From: +1234567890 (John Doe)
📝 Type: text
🆔 Message ID: wamid.xxx
🏢 Tenant: My Company (abc123...)
📱 Account: +1987654321
📄 Text: "Hola, necesito ayuda"
💬 ===============================================
```

### 4. Diagnóstico de Problemas

Si no ves mensajes en el chat, revisa:

**En Webhook Logs (`/admin/webhook-logs`):**
- ¿Hay logs recientes? Si no, Meta no está enviando webhooks
- ¿Los logs muestran mensajes? Si sí, el webhook está funcionando
- ¿Hay errores? Los verás en rojo con detalles

**En Consola del Servidor:**
- Busca los emojis: 🔔, 💬, ❌
- Si ves ❌ "ACCOUNT NOT FOUND", el phone_number_id no coincide con la base de datos
- Si ves ❌ "TENANT NOT FOUND", el tenant_id no existe

**Problemas Comunes:**

1. **Meta no envía webhooks:**
   - Verifica la configuración del webhook en Meta Business Suite
   - Asegúrate de usar la URL correcta (con ngrok si estás en local)
   - Verifica que el Verify Token coincida

2. **Webhooks llegan pero no se procesan:**
   - Revisa los logs en `/admin/webhook-logs`
   - Busca errores en la consola del servidor
   - Verifica que el Access Token no haya expirado

3. **Access Token expirado:**
   - Los mensajes dejarán de enviarse
   - Ve a `/admin/tenants` → Click en "Edit"
   - Obtén un nuevo token de Meta Business Suite
   - Actualiza el campo "Access Token"

## URLs Importantes

- **Tenants:** http://localhost:3000/admin/tenants
- **Webhook Logs:** http://localhost:3000/admin/webhook-logs
- **Editar Tenant:** http://localhost:3000/admin/tenants/[ID]/edit

## Configuración de Webhook en Meta

Para configurar el webhook en Meta Business Suite:

1. **Webhook URL:** Se muestra en la página de edición del tenant
   - Formato: `https://tu-dominio.com/api/webhooks/whatsapp/[TENANT_ID]`

2. **Verify Token:** También se muestra en la página de edición
   - Cópialo y úsalo en la configuración de Meta

3. **Eventos a suscribir:**
   - `messages` - Para recibir mensajes entrantes
   - `message_status` - Para recibir actualizaciones de estado

## Testing

Para probar que todo funciona:

1. Abre `/admin/webhook-logs` en tu navegador
2. Envía un mensaje de WhatsApp a tu número de negocio
3. Deberías ver aparecer un nuevo log en tiempo real con:
   - El contenido del mensaje
   - El número de teléfono del remitente
   - El estado del procesamiento

Si no aparece nada, revisa:
- La configuración del webhook en Meta Business Suite
- Que ngrok esté corriendo (si estás en local)
- Los logs de la consola del servidor
