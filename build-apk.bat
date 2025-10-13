@echo off
echo ========================================
echo    GENERADOR DE APK - CARINI APP
echo ========================================
echo.

REM Configurar variables de entorno
set ANDROID_HOME=C:\Users\joine\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin

echo ✅ Variables configuradas
echo.

REM Verificar Android SDK
echo 🔍 Verificando Android SDK...
"%ANDROID_HOME%\platform-tools\adb.exe" version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Android SDK no encontrado
    echo Instala Android Studio desde: https://developer.android.com/studio
    pause
    exit /b 1
)

echo ✅ Android SDK configurado correctamente
echo.

REM Limpiar builds anteriores
echo 🧹 Limpiando builds anteriores...
if exist android\app\build rmdir /s /q android\app\build
if exist android\build rmdir /s /q android\build

REM Regenerar proyecto
echo 🔄 Regenerando proyecto Android...
npx expo prebuild --platform android --clean

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error al regenerar proyecto
    pause
    exit /b 1
)

REM Generar APK
echo 🚀 Generando APK...
cd android
call gradlew assembleDebug --no-daemon

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ ¡APK GENERADA EXITOSAMENTE!
    echo ========================================
    echo.
    echo 📁 Ubicación: android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo 📱 Para instalar en tu dispositivo:
    echo    "%ANDROID_HOME%\platform-tools\adb.exe" install android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    
    REM Abrir carpeta de la APK
    explorer android\app\build\outputs\apk\debug\
    
) else (
    echo.
    echo ========================================
    echo ❌ ERROR AL GENERAR APK
    echo ========================================
    echo.
    echo 🔍 Revisa los errores arriba para más detalles
    echo.
)

cd ..
pause
