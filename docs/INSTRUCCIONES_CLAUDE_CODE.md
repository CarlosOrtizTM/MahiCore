# Instrucciones para adaptar MahiCore a datos reales de la empresa

> Para el asistente de IA dentro de VS Code. Tú no tienes acceso al documento de especificación (`PROYECTO.html`), así que aquí van citados textualmente los pasajes que importan. **Cuando este archivo y tu criterio choquen, gana este archivo.** Si algo no está claro, pregunta antes de ejecutar.

---

## 0. Reglas que no se negocian

1. **Ningún dato real de la empresa sale del equipo de la empresa.** Eso incluye el Excel del mapa de red. No lo subas a Neon, Supabase ni a ningún servicio en la nube, ni a un repositorio personal, ni lo pegues en un chat.
2. **No uses servicios en la nube para la base de datos.** El documento exige PostgreSQL en Docker local: *"Docker Desktop: Levanta PostgreSQL 16 en un contenedor, sin instalarlo en tu equipo (puerto 5436)."* Si Docker no está permitido o no se puede instalar en el equipo, **detente y avisa al usuario** para que lo consulte con su tutor. No propongas la nube como alternativa.
3. **El `.env` nunca se sube a git.** Verifica que `.env` esté en `.gitignore` y revisa el historial con `git log --all --oneline -- .env`. Si alguna vez se subió, avisa al usuario.
4. **El seed solo lleva datos inventados** y nunca se ejecuta contra una base con datos reales: *"El seed no debe ejecutarse en producción."*
5. Antes de cualquier comando destructivo (`migrate reset`, `db push --force-reset`, borrar carpetas), pide confirmación.
6. No instales nada sin versión fijada. Ver sección 3.H.

---

## 1. Estado actual del repositorio

- Next.js 14.2.35, TypeScript 5, Tailwind 3.4, App Router, `src/`.
- Prisma 5.22 estable (se descartó la RC 8.0.0-rc.20). Los residuos de esa RC (`.agents/`, `.claude/`, `.cursor/`, `.devin/`, `prisma.config.ts`, script `postinstall` con `prisma skills sync`) ya se borraron; **verifica que no hayan vuelto**.
- Base de datos: PostgreSQL en **Neon** (nube), solo para pruebas con datos inventados. El `.env` tiene `DATABASE_URL` y `DIRECT_URL` de Neon.
- Schema provisional con un solo modelo `Activo` (id Int, nombre, tipo String libre, estado enum `EstadoActivo`, `@@map("activos")`). **No corresponde al documento.**
- Código provisional: `src/lib/prisma.ts`, `src/app/api/activos/route.ts` (GET y POST **sin verificación de sesión**), `src/app/api/activos/stats/route.ts`, y las páginas `/` y `/activos` leyendo ese modelo.
- Páginas: `/login` (solo visual, con imagen de fondo y logo), `/`, `/activos`, `/reportes`. Navbar con logo.
- Problema conocido: `npx prisma init` falla con Node v24. El documento pide **Node 20 LTS**. Si el equipo lo permite, usa Node 20 (nvm). Los comandos `migrate` y `generate` sí funcionan.

## 2. Objetivo

Dejar el proyecto **alineado con el documento** para que pueda apuntar a una PostgreSQL local en Docker con datos reales sin rehacer nada. Cambiar de datos de prueba a reales debe reducirse a cambiar `DATABASE_URL` y correr migraciones.

---

## 3. Cambios requeridos (en este orden)

### A. Infraestructura: Neon → PostgreSQL 16 en Docker

Crea `docker-compose.yml` en la raíz, tal como lo define el documento:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: mahicore-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: mahi_admin
      POSTGRES_PASSWORD: mahi_local_dev
      POSTGRES_DB: mahicore
    ports:
      - "5436:5432"   # puerto de tu equipo : puerto del contenedor
    volumes:
      - mahicore_pgdata:/var/lib/postgresql/data
volumes:
  mahicore_pgdata:
```

Crea `.env.example` (este **sí** se sube a git, solo con valores de ejemplo):

```
DATABASE_URL="postgresql://mahi_admin:mahi_local_dev@localhost:5436/mahicore?schema=public"
NEXTAUTH_SECRET="reemplazar"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="reemplazar-por-64-caracteres-hex"
```

Cambios:
- En `prisma/schema.prisma`, **elimina `directUrl`**. Solo existía por el pooler de Neon; con Docker local no hace falta. El `datasource` queda con `provider = "postgresql"` y `url = env("DATABASE_URL")`.
- Quita `DIRECT_URL` del `.env` y apunta `DATABASE_URL` a la base local.
- Agrega a `package.json`: `"prisma": { "seed": "tsx prisma/seed.ts" }`.
- Instala `tsx` como dependencia de desarrollo si falta.

### B. Reemplazar el modelo `Activo` por el esquema completo

El documento (sección 4) **no tiene tabla `Activo`**. La entidad central es `Equipo`. Los archivos `schema.prisma` y `seed.ts` entregados junto con este documento ya implementan el esquema; cópialos a `prisma/` (revisa que `schema.prisma` no vuelva a traer `directUrl`). Debe contener estos modelos: `Sede`, `Piso`, `Sala`, `Rack`, `Responsable`, `Equipo`, `Puerto`, `Enlace`, `Cuenta`, `AccesoLog`, `User`, y estos enums:

```prisma
enum Rol          { lector editor administrador }
enum TipoEquipo   { switch router firewall camara access_point servidor otro }
enum EstadoEquipo { activo mantenimiento baja }
enum MedioEnlace  { fibra utp_cat6 coaxial }
```

Reglas de integridad que el esquema y la API deben cumplir (sección 4.2, textual):

- *"Borrado en cascada: eliminar una Sede o un Piso elimina también sus Salas, Racks y Equipos."*
- *"Equipos y enlaces: al borrar un Equipo se eliminan sus Puertos y, con ellos, sus Enlaces."*
- *"Un puerto, un enlace activo: un puerto puede aparecer como A o como B, así que un @unique por columna no alcanza. El endpoint POST /api/enlaces verifica dentro de una transacción que ninguno de los dos puertos tenga ya un enlace con activo = true. Desconectar un cable no borra la fila: marca activo = false y guarda fechaBaja, así queda el historial."*
- *"Sala y rack coherentes: si un Equipo tiene rackId, su salaId debe ser la sala de ese rack. La API lo valida al crear y al mover equipos."*
- *"Posición en el rack: un equipo ocupa desde uInicio hasta uInicio + alturaU − 1. Antes de guardar, la API comprueba que ese rango no se cruce con otro equipo del mismo rack y que no pase de unidadesU. Las coordenadas XYZ son solo para la vista 3D."*
- *"Auditoría preservada: borrar una Cuenta no borra sus registros en AccesoLog; la llave foránea queda en nulo (onDelete: SetNull)."*
- *"Valores cerrados con enums: tipo de equipo, estado, medio del enlace y rol son enum de Prisma, no texto libre."*

Después: borra las migraciones provisionales de `prisma/migrations/` (solo contienen el modelo `Activo` y datos de prueba), levanta Docker y ejecuta `npx prisma migrate dev --name init`. **Pide confirmación antes de borrar migraciones.**

**El seed entregado está incompleto.** Debe además crear los tres usuarios de prueba (sección 11.1), todos con `cambioPendiente = true`:

| Usuario | Contraseña inicial | Rol |
|---|---|---|
| admin | admin123 | administrador |
| editor | editor123 | editor |
| lector | lector123 | lector |

Las contraseñas se guardan con el hash descrito en 3.E, nunca en texto plano.

### C. Eliminar el código provisional

- Borra `src/app/api/activos/` completo (el POST está abierto a cualquiera y escribe en la base).
- Renombra `src/lib/prisma.ts` a `src/lib/db.ts` (el documento ubica ahí la *"Instancia única de PrismaClient"*) y actualiza todos los imports. Conserva el patrón singleton con `globalThis`.
- Elimina cualquier referencia a `Activo` / `EstadoActivo` / `prisma.activo`.

### D. Interfaz

- `/activos` pasa a **`/equipos`** (sección 7.2: *"CRUD completo de dispositivos. Al crear un equipo se generan sus puertos según el tipo: switch 24, router 4, firewall 8; los demás tipos arrancan sin puertos y se agregan a mano. Datos variables como IPs o VLANs de gestión van en el campo configuracion (JSON)."*).
- Agrega `/ubicaciones` y `/responsables` (7.3: *"Administración de la jerarquía Sede → Piso → Sala → Rack y del directorio de personas a cargo de equipos y cuentas. Son los primeros módulos a construir (Fase 3), porque todo lo demás depende de ellos."*).
- Dashboard `/` (7.1): se renderiza con Server Components. *"Muestra contadores clave, credenciales que vencen en los próximos 15 días (según fechaVencimiento), enlaces pendientes de verificar en campo y el acceso a la importación desde Excel."*
- Actualiza el navbar: Dashboard, Equipos, Ubicaciones, Responsables (Cuentas y Auditoría cuando existan; Auditoría solo visible para administrador, pero eso no sustituye la verificación en el servidor).
- Sistema de diseño (sección 8): *"línea estética brutalista técnica de alta legibilidad, empleando bordes definidos de 1px, tipografía monoespaciada para datos técnicos y contrastes marcados sin gradientes difusos innecesarios."* Tokens ya configurados en `tailwind.config.ts`: `mahiWhite #FFFFFF`, `mahiLight #F6F6F8`, `mahiDark #15161A`, `mahiBlue #2F5AFE`, `mahiRed #E11D48`. La interfaz actual usa sombras suaves y esquinas redondeadas; **no la cambies sin preguntar**, solo señala la diferencia al usuario.
- Quita del `tailwind.config.ts` las entradas `background`/`foreground` solo si `globals.css` y `layout.tsx` dejan de usarlas.

### E. Autenticación y roles (Fase 2)

Textual de la sección 5:

- *"La autenticación usa NextAuth.js con un proveedor de credenciales local, sin servicios externos. Las contraseñas de los usuarios se guardan como hash PBKDF2-SHA512 con 600.000 iteraciones y un salt aleatorio de 16 bytes."*
- Sesión: *"JWT con maxAge de 1 hora que se renueva con la actividad."*
- Bloqueo: *"tras 5 intentos fallidos seguidos, bloqueadoHasta se fija 15 minutos en el futuro y el login se rechaza hasta esa hora. Un login correcto reinicia intentosFallidos."*
- *"Los usuarios creados por el seed o por un administrador tienen cambioPendiente = true y deben definir su propia contraseña en el primer ingreso."*
- Matriz de roles: `lector` solo ve; `editor` crea/edita/borra, revela contraseñas (con reautenticación) e importa Excel; `administrador` hace todo lo anterior y además ve la auditoría.
- Dónde se verifica: *"El middleware.ts solo redirige al login a quien no tiene sesión; es una comodidad de navegación, no una barrera de seguridad. [...] Por eso cada Route Handler verifica la sesión y el rol por su cuenta"* (por la vulnerabilidad CVE-2025-29927 de Next.js). Implementa `src/lib/guard.ts`:

```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
const NIVEL = { lector: 1, editor: 2, administrador: 3 } as const;
type Rol = keyof typeof NIVEL;
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function requireRole(minimo: Rol) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new HttpError(401, "Sesión no válida");
  const rol = session.user.role as Rol;
  if (NIVEL[rol] < NIVEL[minimo]) throw new HttpError(403, "Permisos insuficientes");
  return session.user;
}
```

`requireRole(...)` va como **primera línea de cada handler**. Ocultar un botón en la interfaz no cuenta como seguridad.

Conecta la pantalla `/login` existente con NextAuth sin cambiar su diseño. Instala `next-auth@4` (no la v5).

### F. API y auditoría

Todas las rutas exigen sesión; el rol indicado es el mínimo (sección 9):

| Método | Ruta | Mínimo |
|---|---|---|
| GET / POST | `/api/equipos` | lector / editor |
| PUT / DELETE | `/api/equipos/[id]` | editor |
| GET / POST | `/api/ubicaciones` | lector / editor |
| DELETE | `/api/ubicaciones/[nivel]/[id]` | administrador |
| GET / POST | `/api/responsables` | lector / editor |
| GET / POST | `/api/cuentas` | lector / editor |
| POST | `/api/cuentas/[id]/revelar` | editor |
| GET / POST | `/api/enlaces` | lector / editor |
| DELETE | `/api/enlaces/[id]` | editor (desconecta: `activo = false`) |
| GET | `/api/audit` | administrador |
| POST | `/api/import` | editor |

Códigos HTTP: 200/201 éxito, **400** cuerpo inválido según Zod, **401** sin sesión (o contraseña de confirmación incorrecta), **403** rol insuficiente, **404** no existe, **409** conflicto (por ejemplo, unidades U ocupadas con `"codigo": "UNIDADES_OCUPADAS"`).

Auditoría (sección 5.5): *"No existe ningún endpoint de UPDATE ni DELETE para AccesoLog; la API solo inserta y lee. El registro se escribe en la misma transacción que la acción auditada: si falla el log, falla la acción. El campo detalle nunca guarda contraseñas ni valores cifrados."*

Validación de entrada con **Zod** en cada handler.

### G. Secretos y bóveda de cuentas

- Genera los secretos con estos comandos, sin inventarlos:
  - `NEXTAUTH_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
  - `ENCRYPTION_KEY`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` (exactamente 64 caracteres hex).
- Cifrado (5.4): *"AES-256-GCM antes de guardarse. El valor almacenado en passwordReferencia tiene el formato iv:tag:cifrado en hexadecimal, con un IV nuevo de 12 bytes en cada cifrado."* Los listados nunca incluyen la contraseña; revelar exige `POST` con `{"confirmPassword": "..."}` y genera un registro `ver_credencial` en `AccesoLog`, exitoso o no.
- *"No cambies la ENCRYPTION_KEY con datos cargados."* En producción la llave va en un gestor de secretos, no en un archivo.

### H. Versiones fijadas (el documento las fija a propósito)

```
npm install @prisma/client@5 next-auth@4 lucide-react zod
npm install three @react-three/fiber@8 @react-three/drei@9
npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
npm install -D prisma@5 tsx @types/three
```

Next.js 14 usa React 18; *"las versiones más nuevas de algunas librerías exigen React 19 y fallan al instalar"* (`@react-three/fiber` 9 y `drei` 10). Usa `--save-exact` en Prisma. No instales la CLI de Neon ni ningún paquete "skills" o MCP de bases de datos.

### I. Fases posteriores (no hacer todavía, pero no bloquearlas)

- **Importación desde Excel (Fase 8):** SheetJS, *"cada fila se procesa por separado y los errores se reportan como advertencias"*. El Excel real del mapa de red se importa **solo** contra la base local de la empresa. Antes de implementarlo, compara los tipos de equipo y de cable del Excel con los enums; si falta alguno, se agrega al enum con una migración.
- **Topología 7A / 7B:** 7A es la vista 2D del rack de 42U en HTML/CSS; 7B el gemelo 3D con arrastre y cables entre puertos. Las coordenadas `positionX/Y/Z` del `Equipo` ya existen para eso.

---

## 4. Orden de ejecución y verificación

1. Docker local arriba: `docker compose up -d` y `docker ps` muestra `mahicore-db`.
2. `.env` local creado desde `.env.example` con secretos generados.
3. Schema nuevo + migración `init` aplicada: `npx prisma migrate dev --name init` sin errores.
4. `npx prisma db seed` carga solo datos inventados (incluye los tres usuarios).
5. Se eliminó el código provisional (3.C) y `npm run build` compila sin errores de tipos.
6. Login real + `guard.ts`, y recién después las rutas de la API.
7. Prueba cada endpoint con Thunder Client o Postman usando un usuario `lector`: lo que exija editor debe responder 403 y sin sesión 401.

Errores comunes: `P1001: Can't reach database` significa que el contenedor no está corriendo o el puerto no coincide (5436).

## 5. Criterios de aceptación (sección 13, resumen textual)

- Cada Route Handler verifica sesión y rol, probado con peticiones directas.
- Ningún listado ni respuesta incluye contraseñas en texto claro.
- Toda mutación y todo revelado de credencial genera un registro en `AccesoLog`, en la misma transacción.
- Borrar equipos, salas o sedes elimina en cascada lo que corresponde.
- Dos equipos no pueden ocupar la misma unidad U del mismo rack, ni pasar del límite del rack: la API responde 409.
- Un puerto solo puede tener un enlace activo a la vez; desconectar conserva el historial.
- La importación de Excel reporta las filas con error como advertencias y procesa el resto.

## 6. Al terminar, reporta al usuario

Qué archivos creaste, modificaste y borraste; si hubo que desviarse de este documento y por qué; y qué quedó pendiente. No des nada por terminado sin haber corrido la verificación de la sección 4.
