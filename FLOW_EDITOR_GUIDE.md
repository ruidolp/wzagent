# Guía del Editor de Flujos Visual

## Acceso

**URL:** `/admin/flows`

**Desde Tenants:** Click en el botón morado "🎨 Editor de Flujos"

## Características Principales

### 1. Selección de Tenant
- Primero selecciona el tenant con el que trabajarás
- Los flujos son específicos por tenant

### 2. Crear Nuevo Flujo
1. Selecciona un tenant
2. Click en "Nuevo" (botón verde)
3. Ingresa nombre y descripción
4. El flujo se crea y abre automáticamente

### 3. Tipos de Nodos Disponibles

#### 📱 Mensaje de Texto
- Envía mensajes de texto simples
- Soporta variables: `{nombre}`, `{phone}`
- Máximo 4096 caracteres

#### 📋 Menú (Lista)
- Lista interactiva de WhatsApp
- **Máximo 10 opciones**
- Incluye encabezado, cuerpo y footer
- Cada opción tiene título y descripción

#### 🔘 Botones
- Botones de respuesta rápida
- **Máximo 3 botones**
- Ideal para opciones simples (Sí/No, Aceptar/Cancelar)

#### 💾 Capturar Datos
- Solicita información al usuario
- Validaciones: email, teléfono, número
- Opción de guardar en perfil de usuario
- Ejemplos: nombre, email, edad, dirección

#### 🔀 Condición
- Bifurca el flujo según condiciones
- Operadores: igual, diferente, contiene, mayor que, menor que
- Evalúa variables del contexto

#### ✨ Respuesta AI
- **Próximamente**: Respuestas inteligentes con IA
- Actualmente disponible solo para planificación
- No ejecuta lógica aún

### 4. Construyendo un Flujo

#### Agregar Nodos
1. **Arrastra** un nodo desde la paleta izquierda al canvas
2. Suelta en la posición deseada
3. El nodo aparecerá en el canvas

#### Conectar Nodos
1. Haz click en el punto **inferior** del nodo origen
2. Arrastra hasta el punto **superior** del nodo destino
3. Se creará una conexión automáticamente

#### Editar Nodos
1. **Click** en el nodo para seleccionarlo
2. El panel derecho mostrará sus propiedades
3. Edita la configuración
4. Click en "Guardar Cambios"

#### Eliminar Nodos
1. Selecciona el nodo
2. Click en "Eliminar Nodo" (botón rojo) en el panel de propiedades
3. Confirma la eliminación

### 5. Guardar el Flujo

**Auto-guardado:** No existe, debes guardar manualmente

**Indicador de cambios:** ⚠️ "Hay cambios sin guardar"

**Guardar:**
1. Click en "Guardar" (botón azul superior)
2. Espera confirmación
3. El indicador de cambios desaparecerá

### 6. Asignar Flujos a Usuarios

Después de crear un flujo:
1. Ve a **Admin → Tenants → [Tu Tenant] → Edit**
2. En "Configuración de Conversaciones":
   - **Usuarios Nuevos:** Selecciona flujo para primer contacto
   - **Usuarios Conocidos:** Selecciona flujo para usuarios que regresan

### 7. Variables Disponibles

En cualquier mensaje de texto puedes usar:
- `{nombre}` - Nombre del usuario (si está registrado)
- `{phone}` - Número de teléfono del usuario

Ejemplo:
```
¡Hola {nombre}! Tu número es {phone}. ¿En qué puedo ayudarte?
```

### 8. Restricciones de WhatsApp

**Menús (Listas):**
- Máximo 10 opciones
- Título de opción: máx 24 caracteres
- Descripción: máx 72 caracteres

**Botones:**
- Máximo 3 botones
- Texto de botón: máx 20 caracteres

**Mensajes:**
- Máximo 4096 caracteres por mensaje

### 9. Consejos de Diseño

**Flujo Simple para Empezar:**
```
1. Mensaje de Texto (bienvenida)
2. Menú (opciones principales)
3. Mensaje de Texto (respuesta según selección)
```

**Flujo de Captura de Datos:**
```
1. Mensaje de Texto (explicación)
2. Capturar Datos (nombre)
3. Capturar Datos (email)
4. Mensaje de Texto (confirmación)
```

**Uso de Condiciones:**
```
1. Capturar Datos (edad)
2. Condición (edad >= 18)
   - Si SÍ → Flujo A
   - Si NO → Flujo B
```

### 10. Controles del Canvas

**Zoom:**
- Usa los controles inferiores izquierdos
- O rueda del mouse

**Navegación:**
- Arrastra el fondo del canvas para moverte
- Minimap (esquina inferior derecha) para vista general

**Centrar:**
- Click en el botón "fit view" para centrar todo

### 11. Solución de Problemas

**No puedo arrastrar nodos:**
- Verifica que hayas seleccionado un tenant
- Asegúrate de arrastrar desde la paleta izquierda

**No veo mis cambios en WhatsApp:**
- Verifica que hayas guardado el flujo
- Asegúrate de haber asignado el flujo en Tenant → Edit
- Verifica que el flujo esté activo

**El menú no funciona:**
- Verifica que no tengas más de 10 opciones
- Asegúrate de que cada opción tenga un título

**Los cambios no se guardan:**
- Click explícito en "Guardar"
- Verifica la consola del navegador por errores
- Verifica conexión a base de datos

## Ejemplo Completo: Flujo de Atención al Cliente

```
1. [Texto] "¡Hola {nombre}! Bienvenido a nuestro servicio"

2. [Menú] "¿En qué podemos ayudarte?"
   Opciones:
   - "Información" → Nodo 3
   - "Soporte" → Nodo 4
   - "Ventas" → Nodo 5

3. [Texto] "Aquí está la información que solicitaste..."

4. [Texto] "Un agente te contactará pronto"

5. [Capturar Datos] Campo: "producto_interes"
   Prompt: "¿Qué producto te interesa?"
```

## Próximas Funcionalidades

- ✨ Integración con IA real
- 📊 Analytics de flujos
- 🔄 Templates predefinidos
- 📤 Import/Export de flujos
- 🧪 Modo de prueba/simulación
- 🕐 Delays/esperas programadas
- 🌐 Webhooks a APIs externas
