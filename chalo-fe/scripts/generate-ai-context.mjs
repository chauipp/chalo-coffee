import fs from "fs/promises";
import path from "path";

// CÁCH DÁN ĐƯỜNG DẪN:
// - Với đường dẫn dùng / (Mac, Linux): Dùng ngoặc kép "" bình thường.
// - Với đường dẫn copy từ Windows có \ : Bắt buộc bọc trong String.raw`...`
const filePaths = ["src/services/order/order.types.ts"];

const outputFile = "zforai.md";

async function run() {
  let markdownContent = "# Source Code Context\n\n";

  for (let rawPath of filePaths) {
    // Chuẩn hóa: Đổi toàn bộ \ thành / để Node.js đọc được trên mọi hệ điều hành
    const filePath = rawPath.replace(/\\/g, "/");

    try {
      try {
        await fs.access(filePath);
      } catch {
        console.warn(`⚠️ Bỏ qua (Không tìm thấy): ${filePath}`);
        continue;
      }

      // Đọc nội dung file gốc
      const rawContent = await fs.readFile(filePath, "utf-8");
      const ext = path.extname(filePath).slice(1) || "js";

      // Đưa trực tiếp nội dung gốc vào Markdown, giữ nguyên toàn bộ comment và khoảng trắng
      markdownContent += `### File: \`${filePath}\`\n`;
      markdownContent += `\`\`\`${ext}\n`;
      markdownContent += `${rawContent}\n`;
      markdownContent += `\`\`\`\n\n`;

      console.log(`✅ Đã thêm file: ${filePath}`);
    } catch (error) {
      console.error(`❌ Lỗi khi đọc ${filePath}:`, error);
    }
  }

  await fs.writeFile(outputFile, markdownContent, "utf-8");

  console.log(`\n🎉 Hoàn tất! File đã xuất ra: ${outputFile}`);
  console.log(
    `📝 Chế độ: Giữ nguyên định dạng gốc (Không xóa comment, không nén khoảng trắng).`,
  );
}

run();
