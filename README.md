# Actions-y-Bucket-S3

---

## Paso 1: Creación del repositorio y ramas

Primero creé el repositorio en GitHub con la siguiente estructura de ramas siguiendo **Git Flow**:

- `main` → Rama principal de producción.  
- `dev` → Rama de desarrollo.  
- `feature/despliegue-s3` → Rama para implementar el despliegue.

Luego subí mi web estática con los archivos:
```

index.html
style.css
app.js

```
y añadí un `README.md`

---

## Paso 2: Inicialización del proyecto Node.js

Ejecuté:

```bash
npm init -y
```

Esto creó el archivo `package.json`, que luego edité para agregar scripts y dependencias necesarias.

---

## Paso 3: Configuración de pruebas unitarias con Jest

Instalé Jest:

```bash
npm install --save-dev jest
```

Añadí en el `package.json`:

```json
"scripts": {
  "test": "jest --coverage"
}
```

Luego creé un archivo `test/app.test.js` para validar funciones JavaScript.

---

## Paso 4: Ejecución de pruebas y error con el DOM

Al ejecutar `npm test`, apareció este error:

```
ReferenceError: document is not defined
```

**Causa:** Jest ejecuta las pruebas en un entorno Node.js, y mi código JavaScript accedía directamente al DOM (`document.getElementById`, etc.), lo que no existe en Node.

---

### ✅ Solución aplicada: aislar la lógica del DOM

Separé la lógica de negocio de la manipulación del DOM en archivos distintos:

* `src/logic.js` → contiene funciones puras que no dependen del DOM (por ejemplo, cálculos o validaciones).
* `src/app.js` → contiene el código que interactúa con el DOM.

Así, las pruebas unitarias solo importan y prueban `logic.js`, evitando el error `document is not defined`.

Después de eso, las pruebas se ejecutaron correctamente y Jest generó el reporte de cobertura.

---

## Paso 5: Generación automática de documentación con JSDoc

Instalé JSDoc:

```bash
npm install --save-dev jsdoc
```

Añadí el script:

```json
"scripts": {
  "docs": "jsdoc -c jsdoc.json"
}
```

Luego creé un archivo `jsdoc.json` con la siguiente configuración:

```json
{
  "source": {
    "include": ["src"],
    "includePattern": ".js$"
  },
  "opts": {
    "destination": "docs",
    "template": "default"
  }
}
```

---

### ❌ Error encontrado

Al ejecutar `npm run docs` apareció el siguiente mensaje:

```
FATAL: Unable to load template: Cannot find module 'default/publish'
```

---

### ✅ Solución aplicada: eliminar la plantilla por defecto

Eliminé la línea `"template": "default"` del archivo `jsdoc.json`, quedando así:

```json
{
  "source": {
    "include": ["src"],
    "includePattern": ".js$"
  },
  "opts": {
    "destination": "docs"
  }
}
```

Con esto, JSDoc generó correctamente la documentación en la carpeta `docs/`.

---

## Paso 6: Creación del bucket S3

Dentro del **AWS Academy Learner Lab**, abrí la consola de **Amazon S3** y creé un bucket nuevo con:

* **Nombre único** "actions-y-bucket-s3".
* **Desactivar** “Block all public access”.
* **Activar** “Static website hosting”.

### Configuración adicional

En **Permissions → Bucket policy**, añadí:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::actions-y-bucket-s3/*"
    }
  ]
}
```

---

## Paso 7: Configuración de GitHub Secrets

En **AWS Learner Lab → AWS Details**, accedí a las credenciales temporales y copié los valores de `aws_access_key_id`, `aws_secret_access_key`, `aws_session_token` y `region`.

En el repositorio de GitHub, en **Settings → Secrets and variables → Actions**, añadí:

| Nombre del Secret       | Valor                            |
| ----------------------- | -------------------------------- |
| `AWS_ACCESS_KEY_ID`     | valor de `aws_access_key_id`     |
| `AWS_SECRET_ACCESS_KEY` | valor de `aws_secret_access_key` |
| `AWS_SESSION_TOKEN`     | valor de `aws_session_token`     |
| `AWS_REGION`            | valor de `region` (us-east-1)             |
| `S3_BUCKET_NAME`        | nombre del bucket S3             |

---

## Paso 8: Configuración de GitHub Actions

Creé el archivo `.github/workflows/deploy.yml` con el siguiente contenido:

```yaml
name: Actions - Test, Docs & Deploy a AWS BucketS3

on:
  push:
    branches:
      - dev
      - main
      - 'feature/**'
  pull_request:
    branches:
      - dev
      - main

permissions:
  contents: write

jobs:
  build-and-test:
    name: Build & Test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - run: npm ci
      - run: npm test
      - run: npm run predeploy
      - uses: actions/upload-artifact@v4
        with:
          name: jsdocs
          path: docs

  commit-docs:
    name: Commit generated docs to repo
    runs-on: ubuntu-latest
    needs: build-and-test

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run predeploy
      - run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add -A docs
          git commit -m "chore: update generated docs [skip ci]" || echo "No changes to commit"
          git push origin HEAD:${{ github.ref_name }}

  deploy-to-s3:
    name: Deploy to Amazon S3
    runs-on: ubuntu-latest
    needs: commit-docs

    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-session-token: ${{ secrets.AWS_SESSION_TOKEN }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Sync files to S3
        run: |
          aws s3 sync dist/ s3://$S3_BUCKET_NAME/ --delete
        env:
          S3_BUCKET_NAME: ${{ secrets.S3_BUCKET_NAME }}
```

---

## ⚠️ Paso 9: Errores en el workflow

### 🔹 Error 1: estructura del archivo YAML

```
Invalid workflow file: Unexpected value 'deploy-to-s3'
```

**Solución:** corregí la estructura (el bloque `deploy-to-s3` estaba un nivel más adentro de lo necesario).

---

### 🔹 Error 2: permisos de GitHub Actions

```
remote: Permission to <user>/<repo>.git denied to github-actions[bot].
```

**Solución:** añadí en la raíz del workflow:

```yaml
permissions:
  contents: write
```

---

### 🔹 Error 3: ACLs deshabilitadas en S3

```
An error occurred (AccessControlListNotSupported) when calling the PutObject operation: The bucket does not allow ACLs
```

**Solución:** eliminé `--acl public-read`

---

## ✅ Conclusión

* El pipeline ejecuta **build, test, generación de docs y despliegue** automáticamente.
* Los *jobs* están encadenados (`build-and-test → commit-docs → deploy-to-s3`).
* Los errores de Jest, JSDoc y permisos en S3 fueron resueltos.
* El sitio es accesible públicamente desde la URL del bucket.
https://actions-y-bucket-s3.s3.us-east-1.amazonaws.com/index.html
---



