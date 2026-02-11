# Guía: Solucionar Error de Permisos de WhatsApp

## Error: "(#10) Application does not have permission for this action"

Este error ocurre cuando tu aplicación de Meta no tiene los permisos correctos para enviar mensajes.

## Solución Rápida (5 minutos)

### Paso 1: Verifica tu Access Token

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Selecciona tu aplicación
3. Ve a **WhatsApp > API Setup**
4. En **Temporary access token**, verifica que tu token tenga estos permisos:
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`

**Si no los tiene:** Genera un nuevo token y actualízalo en `/admin/tenants/[id]/edit`

### Paso 2: Agrega Números de Prueba (Solo en Desarrollo)

Si tu app está en modo desarrollo, solo puedes enviar mensajes a números autorizados:

1. Ve a **WhatsApp > API Setup**
2. Busca la sección **"To" phone numbers** o **Phone numbers for testing**
3. Click en **"Manage phone number list"**
4. Click en **"Add phone number"**
5. Ingresa el número (con código de país): `+52XXXXXXXXXX` o `+1XXXXXXXXXX`
6. WhatsApp enviará un código de 6 dígitos al número
7. Ingresa el código para verificar

**Importante:** Cada vez que quieras probar con un nuevo número, debes agregarlo aquí.

### Paso 3: Configura los Webhooks Correctamente

1. Ve a **WhatsApp > Configuration**
2. En **Webhook**, asegúrate de tener suscrito:
   - ✅ `messages` - Para recibir mensajes
   - ✅ `message_status` - Para recibir confirmaciones (enviado, entregado, leído)
3. Verifica la **Callback URL** y **Verify Token**

## Modo Desarrollo vs Producción

### 🔧 Modo Desarrollo (Sandbox)

**Características:**
- ✅ Gratis
- ✅ Ideal para pruebas
- ❌ Solo envía a números autorizados (máximo 5)
- ❌ Límite de 250 conversaciones por día
- ❌ No puedes enviar a usuarios reales

**Cómo agregar números de prueba:**
```
WhatsApp > API Setup > Phone numbers for testing > Add phone number
```

### 🚀 Modo Producción

**Características:**
- ✅ Envía a cualquier número
- ✅ Sin límites (según tu plan)
- ❌ Requiere verificación de negocio
- ❌ Requiere App Review de Meta

**Requisitos:**
1. **Business Verification**: Verificar tu negocio con Meta
2. **App Review**: Solicitar aprobación de permisos:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
3. **System User Access Token**: Usar tokens permanentes (no temporales)

## Verificar Permisos de tu Access Token

Puedes verificar qué permisos tiene tu token actual usando la API de Meta:

```bash
curl -i -X GET \
 "https://graph.facebook.com/v21.0/debug_token?input_token=TU_ACCESS_TOKEN&access_token=TU_ACCESS_TOKEN"
```

Deberías ver en la respuesta:
```json
{
  "data": {
    "scopes": [
      "whatsapp_business_messaging",
      "whatsapp_business_management"
    ],
    ...
  }
}
```

## Generar Access Token Permanente (Producción)

Para producción, necesitas un token que no expire:

### Opción 1: System User Token (Recomendado)

1. Ve a **Meta Business Suite**
2. **Configuración del negocio > Usuarios > Usuarios del sistema**
3. Crea un nuevo System User
4. Asigna permisos al System User:
   - Assets: Tu aplicación de WhatsApp
   - Permissions: Administrador completo
5. Genera un token desde el System User
6. Este token no expira (o expira en 60 días y puedes renovarlo)

### Opción 2: Long-Lived Token

```bash
# Intercambiar token temporal por uno de larga duración (60 días)
curl -i -X GET "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=TU_APP_ID&client_secret=TU_APP_SECRET&fb_exchange_token=TU_TOKEN_TEMPORAL"
```

## Checklist de Verificación

Antes de enviar mensajes, verifica:

- [ ] App tiene permiso `whatsapp_business_messaging`
- [ ] Access Token tiene los scopes correctos
- [ ] Access Token está actualizado en `/admin/tenants/[id]/edit`
- [ ] Si estás en desarrollo: número de destino está agregado en números de prueba
- [ ] Webhook está configurado y recibiendo mensajes (verifica en `/admin/webhook-logs`)
- [ ] Phone Number ID y Business Account ID son correctos

## Problemas Comunes

### "Cannot send message to this number"
- **Causa:** Número no está en la lista de prueba (modo desarrollo)
- **Solución:** Agrega el número en WhatsApp > API Setup > Phone numbers

### "Access token expired"
- **Causa:** Token temporal (válido solo 24 horas)
- **Solución:** Genera un nuevo token o usa un System User token

### "Invalid phone number"
- **Causa:** Formato incorrecto del número
- **Solución:** Usa formato internacional: `+52XXXXXXXXXX` (sin espacios, guiones, ni paréntesis)

### "Rate limit exceeded"
- **Causa:** Demasiados mensajes en poco tiempo
- **Solución:** Espera unos minutos y reintenta

## Testing

Para probar que todo funciona:

1. Asegúrate de tener el token actualizado
2. Agrega tu número de prueba (si estás en desarrollo)
3. Envía un mensaje desde la interfaz de admin
4. Verifica en `/admin/webhook-logs` que llegue la confirmación de estado

## Referencias Útiles

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/overview)
- [WhatsApp Cloud API Permissions](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Meta Business Verification](https://www.facebook.com/business/help/2058515294227817)

---

## Configuración Actual en tu Proyecto

Tu archivo `.env` debe tener:
```
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
ENABLE_WEBHOOK_LOGGING=true
```

Para actualizar el Access Token:
1. Ve a http://localhost:3000/admin/tenants
2. Click en "Edit" del tenant
3. Pega el nuevo Access Token
4. Click en "Save Changes"
