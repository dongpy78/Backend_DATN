#### Setup Database

- Quy trình tạo database

```sh
- Tạo migration (npx sequelize-cli migration:generate --name migration-create-orderpackagepost)
- Tạo model (npx sequelize-cli db:migrate)
```

- Create table Users

```sh
npx sequelize-cli migration:generate --name create-Users-table

npx sequelize-cli migration:generate --name migration-create-blogs
```

- Run the migration to create the Users table:

```sh
npx sequelize-cli db:migrate
```

- If you need to undo the migration, run:

```sh
npx sequelize-cli db:migrate:undo
```

- Thêm dữ liệu vào database

```sh
npx sequelize-cli seed:generate --name demo-users
npx sequelize-cli migration:generate --name create-Company-table
```

- Cập nhật dữ liệu cho database

```sh
npx sequelize-cli seed:generate --name demo-users
npx sequelize-cli migration:generate --name create-Company-table
```

#### Install Packages and Setup Install Script

```sh
npm install bcryptjs@2.4.3 concurrently@8.0.1 cookie-parser@1.4.6 dayjs@1.11.7 dotenv@16.0.3 express@4.18.2 express-async-errors@3.1.1 express-validator@7.0.1 http-status-codes@2.2.0 jsonwebtoken@9.0.0 mongoose@7.0.5 morgan@1.10.0 multer@1.4.5-lts.1 nanoid@4.0.2 nodemon@2.0.22 cloudinary@1.37.3 dayjs@1.11.9 datauri@4.1.0 helmet@7.0.0 express-rate-limit@6.8.0 express-mongo-sanitize@2.2.0
```

server.js

```js
import { value } from "./test.js";
console.log(value);
```

#### Deploy PM2

- Xem danh sach

```sh
pm2 list
```

- Stop pm2

```sh
pm2 stop api-do-an-tim-viec
```

- Start pm2

```sh
pm2 start api-do-an-tim-viec
```

#### Docker

- build docker

```sh
docker-compose -f docker-compose-deploy.yml up -d --build
```

- Stop pm2

```sh
cd /usr/share/nginx/html
```

- Start pm2

```sh
pm2 start api-do-an-tim-viec
```

```sh
pm2 logs api-do-an-tim-viec --lines 100
```

ls -la ~/vandong_k63/Do_An/Backend_Do_An/nginx/dist/

ls -la ~/vandong_k63/Do_An/Backend_Do_An/nginx/admin_dist/

sudo chmod -R 755 ~/vandong_k63/Do_An/Backend_Do_An/nginx/
sudo chown -R $USER:$USER ~/vandong_k63/Do_An/Backend_Do_An/nginx/

docker-compose run --rm certbot certonly --webroot \
 -w /usr/share/nginx/html \
 -d techworks.io.vn -d www.techworks.io.vn -d admin.techworks.io.vn \
 --email your-real-email@example.com --agree-tos --non-interactive

sudo cp -r ~/do*an_tot_nghiep/Backend_Do_An/nginx/dist/* /var/www/techworks-client/
sudo cp -r ~/do*an_tot_nghiep/Backend_Do_An/nginx/admin_dist/* /var/www/techworks-admin/
