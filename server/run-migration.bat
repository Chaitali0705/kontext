@echo off
cd /d "D:\AMD SLINGSHOT\kontext\server"
call npx prisma migrate dev --name add-cascade-to-failures
pause
