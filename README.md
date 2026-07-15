# Landing Page NFCuidado

Landing estatica y minimalista para captar correos de personas interesadas en el lanzamiento oficial de una app NFC orientada al seguimiento familiar de la medicacion.

## Archivos

- `index.html`: landing principal.
- `styles.css`: estilos.
- `config.js`: datos legales y configuracion de envio.
- `script.js`: logica del formulario.
- `aviso-legal.html`: Aviso Legal.
- `privacidad.html`: Politica de Privacidad.
- `cookies.html`: Politica de Cookies para una web sin cookies no esenciales.
- `supabase/schema.sql`: tabla y politicas base para Supabase.

## Antes de publicar

1. Rellena los campos de `config.js` con tus datos reales.
2. Decide como vas a guardar los correos:
   - `submitMode: "mock"` para ver la demo sin backend.
   - `submitMode: "custom-endpoint"` si vas a enviar el formulario a una API propia o Edge Function.
   - `submitMode: "supabase-rest"` si quieres insertar directamente en Supabase con una politica muy restringida.
3. Ejecuta el SQL de `supabase/schema.sql` en el editor SQL de Supabase.
4. Revisa los textos legales con tu asesoria si tu proyecto va a tratar despues datos de salud o a operar con pacientes, centros sanitarios o terceros profesionales.
5. Si vas a mandar emails, incluye siempre un mecanismo de baja sencillo en cada comunicacion.

## Recomendacion tecnica

Para este caso, la opcion mas equilibrada suele ser:

- Landing estatica como esta.
- Supabase para guardar emails y consentimientos.
- Una Edge Function o endpoint intermedio para validar, limitar abuso y registrar las altas en cuanto quieras endurecer seguridad.
- Un proveedor de email separado para enviar el aviso de lanzamiento.

## Integracion rapida con Supabase

### Configuracion actual

La landing ya viene configurada para tu proyecto con:

- `supabaseUrl: "https://vtxbbweqcjsorscsucah.supabase.co"`
- `submitMode: "supabase-rest"`
- tu `publishable key`

### Importante

La `publishable key` es publica por diseno, asi que puede ir en frontend. Lo que protege los datos no es esconder esa clave, sino la politica RLS de la tabla.

### Recomendacion de siguiente nivel

Cuando quieras blindarlo mejor, cambia a `submitMode: "custom-endpoint"` y usa una Edge Function para:

- rate limiting
- validacion extra
- captcha o turnstile
- logs de abuso

## Ejecutar en local

Puedes abrir `index.html` directamente o levantar un servidor estatico, por ejemplo:

```bash
python3 -m http.server 8000
```
