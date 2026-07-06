// src/app/api/mock-sse/route.ts

export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      // Cứ mỗi 3 giây, tự động phát ra một sự kiện 'new_order'
      const intervalId = setInterval(() => {
        const payload = {
          orderId: "MOCK-" + Math.floor(Math.random() * 1000),
          tableId: "T-1",
          tableName: "Bàn Test",
        };

        // ĐÂY LÀ CHUẨN FORMAT CỦA SSE (Bắt buộc phải có \n\n ở cuối)
        const sseMessage =
          `event: new_order\n` + `data: ${JSON.stringify(payload)}\n\n`;

        // Bơm data vào đường ống
        controller.enqueue(new TextEncoder().encode(sseMessage));
      }, 3000);

      // Dọn dẹp khi Khách hàng đóng tab trình duyệt
      request.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  // Trả về response với Header chuẩn của SSE
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
