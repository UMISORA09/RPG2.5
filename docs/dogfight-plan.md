# Kế Hoạch Nâng Cấp Chế Độ Bắn Máy Bay (Dogfight) — BRICKLAND (RPG2.5)

Tài liệu tóm tắt kiến trúc hiện tại của dự án `UMISORA09/RPG2.5` và chốt quy chuẩn kỹ thuật, thiết kế luật chơi cho chế độ không chiến (Dogfight v1).

---

## 1. Bản Đồ Kiến Trúc Hệ Thống (Codebase Overview)

### 1.1. Các file điều khiển máy bay (Player Aircraft & Motion)
* **`src/world/player/PlayerAircraft.js`**:
  * Quản lý vòng đời thực thể máy bay người chơi trong Three.js/WebGPU.
  * Tải và gắn model GLTF (`playerAircraftModel`), điều phối các VFX động cơ phản lực và luồng khí cánh.
  * Cập nhật vị trí, hướng xoay theo từng khung hình và điều khiển camera bám đuổi (`flightTracker`).
* **`src/world/player/AircraftInput.js`**:
  * Lắng nghe tín hiệu đầu vào: Bàn phím (`W`, `A`, `S`, `D`, mũi tên), joystick cảm ứng trên màn hình cảm ứng điện thoại.
  * Chuẩn hóa vector điều hướng và chuyển tới bộ giải tính chuyển động.
* **`src/world/player/aircraftMotion.js`**:
  * Module logic vật lý thuần (kinematics): tính toán lực đẩy (`thrust`), gia tốc, lực cản tuyến tính (`linearDrag`), lực cản góc (`angularDrag`), tốc độ xoay hướng (`heading`).
  * Hỗ trợ 2 chế độ điều khiển: `screen` (bay theo hướng nhìn màn hình) và `plane` (lái kiểu mô phỏng máy bay).
* **`src/world/player/aircraftVisualAttitude.js`**:
  * Xử lý độ nghiêng cánh (bank/roll khi vào cua), ngóc đầu/chúi đầu (pitch khi tăng/giảm ga), hiệu ứng rung lơ lửng (hover) và nhiễu động gió (turbulence).
* **`src/world/player/engineFlameVFX.js` & `wingAirflowVFX.js`**:
  * Tạo hiệu ứng vệt lửa phản lực ở đuôi động cơ và dải khí lướt ở đầu mút cánh máy bay.

### 1.2. Các file dựng thế giới (World & Rendering)
* **`src/world/world.js`**:
  * Bộ điều phối trung tâm của thế giới 3D (`World`). Khởi tạo và liên kết các thành phần: `ChunkManager`, `Terrain`, `BiomeManager`, `PrefabManager`, `PlayerAircraft`, `LandmarkManager`, và hệ thống âm thanh `Audio`.
* **`src/world/chunks/ChunkManager.js`**:
  * Quản lý lưới chunk vô tận 3x3 quanh vị trí máy bay. Điều phối Web Workers (`chunkBuild.worker.js`) chạy đa luồng để dựng địa hình và sắp đặt cây cối không làm giảm khung hình (drop FPS).
* **`src/world/terrain/Terrain.js` / `TerrainBuilder.js`**:
  * Dựng khối hình học địa hình voxel Lego với các núm gạch (Lego studs) đặc trưng, tính toán độ dốc và tô màu theo từng loại địa hình.
* **`src/world/biomes/BiomeManager.js`**:
  * Định nghĩa 7 vùng sinh thái tự nhiên: Rừng xanh tươi, Rừng thu vàng, Đồng cỏ hoa, Đồi cát vàng, Thung lũng nham thạch, Rừng tuyết trắng, Đất ngập nước.
* **`src/world/prefabs/PrefabManager.js` & `PrefabPool.js`**:
  * Render các vật thể môi trường (cây Lego, hoa, tảng đá, công trình) bằng `InstancedMesh` để đạt hiệu năng 60 FPS mượt mà.
* **`src/world/WorldConfig.js`**:
  * Tập trung toàn bộ thông số cấu hình của thế giới, chunk, camera, máy bay và môi trường.

### 1.3. Các file giao diện & hiển thị (UI / HUD)
* **`src/ui/ExplorerUI.js`**:
  * HUD điều khiển chuyến bay: Tọa độ X/Z, tốc độ bay, tên vùng đất sinh thái hiện tại, cần điều khiển joystick cảm ứng, các nút chức năng (về xuất phát, âm thanh, trợ giúp, toàn màn hình, ẩn giao diện).
  * Điều hướng giữa màn hình bay và cổng thông tin chính (`HomePage`).
* **`src/ui/TerrainMinimap.js`**:
  * Bản đồ radar thu nhỏ (minimap) hiển thị địa hình xung quanh máy bay, tọa độ trung tâm và hướng mũi máy bay.
* **`src/pages/HomePage.tsx` / `AppPages.jsx`**:
  * Giao diện cổng thông tin người chơi, giới thiệu game, launcher chế độ mở và trình diễn mô hình 3D mini máy bay xoay 360 độ.

---

## 2. Thông Số Bay Hiện Tại Của Máy Bay

Căn cứ theo cấu hình chuẩn trong `src/world/WorldConfig.js` (`player.aircraft`) và `src/world/player/aircraftMotion.js`:

| Thông số | Giá trị thực tế trong cấu hình | Giá trị mặc định (Fallback) | Đơn vị |
|---|---|---|---|
| **Độ cao cố định (`height`)** | **5.5** | 2.5 | Đơn vị thế giới (world units) |
| **Tốc độ tối đa (`maxSpeed`)** | **8.5** | 8.0 | Ô / giây (world units/s) |
| **Tốc độ góc tối đa (`maxAngularSpeed`)** | **3.4** | 2.8 | Radian / giây |
| **Lực đẩy chính (`thrust`)** | **18** | 14 | Gia tốc |
| **Lực đẩy lùi / giảm tốc (`reverseThrust`)** | **8** | 7 | Gia tốc |
| **Lực cản không khí (`linearDrag`)** | **2.0** | 2.2 | Hệ số giảm tốc |
| **Gia tốc ngang tối đa (`maxLateralAcceleration`)**| **24** | 10 | world units/s² |

---

## 3. Chốt Luật Chơi Không Chiến — Dogfight v1

Chế độ không chiến Dogfight v1 được thiết kế vận hành song song trên nền tảng cơ chế bay mượt mà có sẵn:

### 3.1. Quân địch (Bot AI)
* **Số lượng bot**: Cố định **3 máy bay bot** hoạt động cùng lúc trên không phận.
* **Đặc tính di chuyển**:
  * Bot bay lượn vòng tròn và tự động tìm đường tiếp cận người chơi khi ở cự ly chiến đấu.
  * Khi người chơi lọt vào tầm bắn (bán kính $\le 16$ đơn vị) và nằm trong góc hình nón phía trước mũi máy bay, bot sẽ kích hoạt khai hỏa.
* **Ngoại hình**: Sử dụng lại model máy bay `playerAircraftModel` gốc nhưng nhân bản material với các tông màu chiến đấu nhận diện riêng (Đỏ / Cam / Tím).

### 3.2. Chỉ số máu (HP) & Sát thương (Damage)
* **Máu người chơi (Player HP)**: **100 HP**.
* **Máu bot (Bot HP)**: **50 HP** mỗi chiếc.
* **Sát thương đạn người chơi**: **10 sát thương** / viên trúng đích (cần 5 phát trúng để bắn hạ 1 bot).
* **Sát thương đạn bot**: **8 sát thương** / viên trúng đích.

### 3.3. Cơ chế vũ khí & khai hỏa (Combat Inputs)
* **Phím bấm PC**:
  * Phím **`J`**: Bắn đạn (hỗ trợ nhấn giữ phím để xả đạn liên tục với tốc độ nhịp bắn cố định).
  * **Click chuột trái**: Nhấn chuột lên canvas trò chơi để khai hỏa.
  * Phím **`Space`**: Giữ nguyên làm phím chức năng hệ thống, tuyệt đối không dùng làm nút bắn.
* **Điện thoại / Cảm ứng**:
  * Nút **`BẮN`** tròn nổi bật đặt ở góc dưới cùng bên phải màn hình (tách biệt hoàn toàn, không che cần joystick bên trái).

### 3.4. Cơ chế đạn đạo & Va chạm (Ballistics & Hit Detection)
* Đạn bay theo đường thẳng với vận tốc cao dọc theo hướng mũi máy bay tại thời điểm khai hỏa.
* **Tuổi thọ đạn**: Tối đa **1.2 giây** (tự tiêu biến nếu không trúng mục tiêu).
* **Bán kính va chạm (Hitbox)**: **1.2 đơn vị**. Nếu mục tiêu nằm trong bán kính 1.2 so với viên đạn, ghi nhận trúng đạn và trừ máu ngay lập tức.
* **Hiển thị**: Đạn người chơi màu vàng phát sáng, đạn của bot màu đỏ rực.

### 3.5. Tính điểm & Hồi sinh (Score & Respawn)
* **Điểm thưởng**: Bắn hạ 1 máy bay bot nhận ngay **+100 điểm**.
* **Hồi sinh bot**: Khi bị bắn hạ, bot nổ tung và hồi sinh sau **4 giây** ở vị trí ngẫu nhiên cách người chơi khoảng **12 - 18 đơn vị**.
* **Hồi sinh người chơi**: Khi người chơi hết máu (0 HP), máy bay bị phá hủy và tự động hồi sinh sau **3 giây** với đầy đủ **100% máu (100 HP)**.

### 3.6. Hiển thị thông tin trên HUD & Minimap
* **HUD**:
  * Bổ sung thanh máu người chơi (100 HP), hiển thị điểm số tích lũy và số lượng bot đã bắn hạ.
  * Nút `BẮN` chuyên dụng trên giao diện cảm ứng.
* **Radar Minimap**:
  * Đánh dấu vị trí các bot đang sống bằng chấm đỏ trên minimap để người chơi dễ dàng định vị hướng tiếp cận.

---

## 4. Kế Hoạch Triển Khai Kỹ Thuật (Prompt 1 Preview)

1. **`src/world/combat/dogfight.js`**: Module logic chiến đấu độc lập, thuần JavaScript (không phụ thuộc Three.js), dễ dàng kiểm thử tự động với `node --test`.
2. **`src/world/combat/DogfightSystem.js`**: Hệ thống kết nối Three.js/WebGPU vẽ mô hình bot, hiệu ứng đạn đạo và các tia nổ.
3. **`src/world/player/AircraftInput.js`**: Bổ sung hàm `isFiring()`, `setFiring()` cho phím `J` và cảm ứng/chuột.
4. **`test/dogfight.test.js`**: Bộ kiểm thử tự động bao phủ trọn vẹn quy tắc trừ máu, hồi máu, tính điểm và hồi sinh.
