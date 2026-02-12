# Editor de Flujos - Totalmente Funcional

## ✅ Estado: OPERATIVO Y FUNCIONAL

Los flujos creados en el editor visual son **completamente funcionales** y se ejecutan en WhatsApp.

## Cómo Funcionan los Flujos

### 1. Creación Visual → Base de Datos

Cuando guardas un flujo en el editor:

**a) Se identifican las conexiones:**
- Los edges (flechas) del canvas se convierten a `transitions`
- Cada opción de menú/botón se asocia con su conexión

**b) Se identifica el nodo raíz:**
- Automáticamente se detecta el primer nodo (sin conexiones entrantes)
- Se marca con `parent_node_id = null`

**c) Se procesan los nodos:**
- **Texto:** Guarda el mensaje con variables
- **Menú:** Cada opción recibe su `nextNodeId` según las conexiones
- **Botones:** Cada botón recibe su `nextNodeId` según las conexiones
- **Capturar Datos:** Guarda campo, validación, y siguiente nodo

**d) Se guardan las transitions:**
```json
{
  "default": "siguiente_nodo_id",
  "opt_123": "nodo_opcion_1",
  "opt_456": "nodo_opcion_2"
}
```

### 2. Ejecución en WhatsApp

Cuando un usuario escribe:

**a) Se carga el flujo:**
- flow-execution.service busca el flujo asignado
- Encuentra el nodo raíz (`parent_node_id = null`)

**b) Se ejecuta cada nodo:**
- Cada tipo de nodo tiene un handler específico
- El handler envía el mensaje a WhatsApp
- Espera respuesta del usuario si es necesario

**c) Se navega por las transitions:**
- Según la respuesta del usuario, se elige el siguiente nodo
- Para menús/botones: usa el `id` de la opción seleccionada
- Para otros nodos: usa la transition `default`

**d) Se actualiza el contexto:**
- Variables capturadas se guardan en `conversation.context`
- Se puede usar en mensajes posteriores con `{nombre}`, `{email}`, etc.

## Tipos de Nodos y Cómo Conectarlos

### 📱 Mensaje de Texto

**Configuración:**
- Mensaje con variables `{nombre}`, `{phone}`

**Conexiones:**
- 1 handle de salida (abajo)
- Conecta al siguiente nodo automáticamente

**Uso en WhatsApp:**
- Envía el mensaje
- Avanza al siguiente nodo inmediatamente

---

### 📋 Menú (Lista)

**Configuración:**
- Encabezado, cuerpo, texto del botón
- Hasta 10 opciones con título y descripción

**Conexiones:**
- Cada opción tiene su propio handle (derecha)
- Conecta cada opción al nodo que debe ejecutarse

**Uso en WhatsApp:**
- Muestra lista interactiva
- Usuario selecciona una opción
- Ejecuta el nodo conectado a esa opción

**Ejemplo de conexión:**
```
Menú Principal
├── Opción "Información" → Nodo: Mensaje Info
├── Opción "Soporte" → Nodo: Mensaje Soporte
└── Opción "Ventas" → Nodo: Capturar Email
```

---

### 🔘 Botones

**Configuración:**
- Mensaje
- Hasta 3 botones con título

**Conexiones:**
- Cada botón tiene su propio handle (derecha)
- Conecta cada botón al nodo correspondiente

**Uso en WhatsApp:**
- Muestra botones de respuesta rápida
- Usuario hace click en un botón
- Ejecuta el nodo conectado a ese botón

**Ejemplo:**
```
¿Deseas continuar?
├── Botón "Sí" → Nodo: Capturar Nombre
└── Botón "No" → Nodo: Mensaje Despedida
```

---

### 💾 Capturar Datos

**Configuración:**
- Campo a capturar (ej: "email", "nombre")
- Pregunta para el usuario
- Validación: email, teléfono, número, o ninguna
- Guardar en perfil de usuario (opcional)

**Conexiones:**
- 1 handle de salida (abajo)
- Conecta al siguiente nodo

**Uso en WhatsApp:**
1. Envía la pregunta al usuario
2. Espera respuesta del usuario
3. Valida la respuesta
4. Si válida: guarda y avanza
5. Si inválida: pide nuevamente

**Variables disponibles después:**
- Se guarda en contexto: `conversation.context[campo]`
- Úsala en mensajes: `{campo}`

**Ejemplo:**
```
Capturar Datos: "email"
Pregunta: "¿Cuál es tu email?"
Validación: email
→ Mensaje: "Gracias {nombre}, te enviaremos info a {email}"
```

---

### 🔀 Condición (Próximamente Funcional)

**Configuración:**
- Variable a evaluar
- Operador: igual, diferente, contiene, mayor, menor
- Valor a comparar

**Conexiones:**
- 2+ handles de salida
- Conecta cada resultado posible

**Nota:** Interfaz lista, lógica pendiente

---

### ✨ AI (Próximamente)

**Configuración:**
- Prompt del sistema
- Tokens máximos

**Nota:** Interfaz lista, sin integración AI aún

## Validaciones al Guardar

El editor valida antes de guardar:

✅ **Al menos 1 nodo**
✅ **Solo 1 nodo inicial** (sin conexiones entrantes)
✅ **Menús con 1-10 opciones**
✅ **Botones con 1-3 botones**
✅ **Mensajes de texto no vacíos**

Si hay errores, muestra un alert con los problemas.

## Flujo de Ejemplo Funcional

### Flujo de Registro de Usuario

```
1. [Texto]
   "¡Hola! Bienvenido a nuestro servicio 👋"
   ↓

2. [Capturar Datos]
   Campo: "name"
   Pregunta: "¿Cuál es tu nombre?"
   Guardar: Sí
   ↓

3. [Capturar Datos]
   Campo: "email"
   Pregunta: "¿Cuál es tu email?"
   Validación: Email
   Guardar: Sí
   ↓

4. [Texto]
   "¡Gracias {name}! Te hemos enviado un email a {email}"
   ↓

5. [Menú]
   "¿Qué te interesa?"
   ├── "Productos" → Nodo 6
   ├── "Servicios" → Nodo 7
   └── "Contacto" → Nodo 8

6. [Texto] "Aquí están nuestros productos..."
7. [Texto] "Aquí están nuestros servicios..."
8. [Texto] "Contáctanos al..."
```

### Cómo Crear Este Flujo

1. Arrastra nodo "Texto" al canvas
2. Edita: "¡Hola! Bienvenido..."
3. Arrastra "Capturar Datos"
4. Conecta Texto → Capturar Datos (arrastra desde abajo del texto a arriba del capturar)
5. Edita Capturar: campo "name", pregunta "¿Cuál es tu nombre?", guardar Sí
6. Arrastra otro "Capturar Datos" para email
7. Conecta nombre → email
8. Edita: campo "email", validación "email", guardar Sí
9. Arrastra "Texto" para confirmación
10. Edita: "¡Gracias {name}! Te hemos enviado..."
11. Conecta email → confirmación
12. Arrastra "Menú"
13. Edita menú: agrega 3 opciones (Productos, Servicios, Contacto)
14. Conecta confirmación → menú
15. Arrastra 3 nodos "Texto" para cada opción
16. Conecta cada handle del menú a su nodo correspondiente
17. Guarda el flujo
18. Asigna en Tenant → Edit → "Usuarios Nuevos"

## Variables en Mensajes

**Variables del sistema:**
- `{nombre}` - Nombre del usuario
- `{phone}` - Teléfono del usuario

**Variables capturadas:**
- Cualquier campo capturado con "Capturar Datos"
- Ejemplo: si capturas "email", puedes usar `{email}`

**Ejemplo:**
```
"Hola {nombre}, tu email {email} ha sido registrado.
Te contactaremos al {phone} pronto."
```

## Asignar Flujos a Usuarios

Después de crear un flujo:

1. Ve a **Admin → Tenants → [Tu Tenant] → Edit**
2. Scroll a "Configuración de Conversaciones"
3. **Usuarios Nuevos:** Selecciona flujo para primer contacto
4. **Usuarios Conocidos:** Selecciona flujo para retorno
5. Guarda cambios

Ahora cuando un usuario escriba:
- Si es nuevo → ejecuta flujo de nuevos
- Si ya existe → ejecuta flujo de conocidos

## Debugging

**Si el flujo no funciona:**

1. **Verifica guardado:** ¿Presionaste "Guardar"?
2. **Verifica asignación:** ¿Está asignado en Tenant → Edit?
3. **Verifica validación:** ¿Pasó todas las validaciones?
4. **Verifica conexiones:** ¿Todos los nodos están conectados?
5. **Verifica nodo inicial:** ¿Hay un solo nodo sin conexiones entrantes?
6. **Verifica opciones:** En menús/botones, ¿cada opción está conectada?

**Logs útiles:**
```bash
# Desarrollo
npm run dev

# En consola del servidor, busca:
- "Executing flow"
- "Handler execution failed"
- "No flow found for user"
```

## Limitaciones de WhatsApp

**Menús:**
- Máximo 10 opciones
- Título: 24 caracteres
- Descripción: 72 caracteres

**Botones:**
- Máximo 3 botones
- Título: 20 caracteres

**Mensajes:**
- Máximo 4096 caracteres

## Próximas Mejoras

- [ ] Handler de Condiciones funcional
- [ ] Integración con AI real
- [ ] Delays entre mensajes
- [ ] Webhooks a APIs externas
- [ ] Analytics de flujos
- [ ] Templates predefinidos
- [ ] Modo de prueba/simulación
