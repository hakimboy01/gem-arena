# Gem Arena Online Deployment
1. Deploy backend Node.js dengan `npm start`.
2. Set DATABASE_URL menggunakan Neon connection string sebagai environment variable.
3. Set CORS_ORIGIN ke domain HTTPS game.
4. Test endpoint /health.
5. Jangan pernah menyimpan DATABASE_URL di file publik.

Catatan: identitas anonim saat ini hanya untuk pengujian. Tambahkan autentikasi server-side sebelum peluncuran publik. Validasi kemenangan, rank, mata uang, dan item berbayar di server.
