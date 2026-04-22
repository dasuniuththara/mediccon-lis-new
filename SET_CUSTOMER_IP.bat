@echo off
echo ====================================================
echo   MEDICCON LIS - IP OVERWRITE (METHOD 3)
echo ====================================================
echo.

:: Use and Index or Name to force the change
echo Trying to force IP 192.168.2.41 on Wi-Fi...
powershell -Command "Set-NetIPInterface -InterfaceAlias 'Wi-Fi' -Dhcp Disabled"
powershell -Command "Get-NetIPAddress -InterfaceAlias 'Wi-Fi' | Remove-NetIPAddress -Confirm:$false"
powershell -Command "New-NetIPAddress -InterfaceAlias 'Wi-Fi' -IPAddress 192.168.2.41 -PrefixLength 24 -DefaultGateway 192.168.2.1"

echo.
echo ====================================================
echo   CHECKING STATUS...
ipconfig | findstr "192.168.2."
echo ====================================================
echo.
pause
