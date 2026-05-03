@echo off
netsh advfirewall firewall delete rule name="Expo Metro 8081" >nul 2>&1
netsh advfirewall firewall add rule name="Expo Metro 8081" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="Expo Metro 8082" dir=in action=allow protocol=TCP localport=8082
echo.
echo Firewall rules added successfully!
echo You can now scan the QR code with Expo Go.
pause
