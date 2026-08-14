# Hiển thị logo huy hiệu Chalo

## Khi nào gặp lại

Logo nhìn như bị thu nhỏ hoặc phần hình hải cẩu bị lọt thỏm dù đã tăng kích thước thẻ chứa.

## Cách làm đúng

Asset hiển thị chính là `chalo-fe/public/brand/chalo-logo-round.png`, một PNG vuông có nền
trong suốt bên ngoài huy hiệu. Component `chalo-fe/src/components/shared/BrandLogo.tsx` dùng
asset này trực tiếp; favicon trong `layout.tsx` cũng trỏ về cùng file.

## Cái bẫy

Chỉ thêm `object-contain` hoặc tăng `width/height` cho ảnh JPG gốc không cắt được khoảng trắng;
hình tròn vẫn nhỏ và hải cẩu trông bị chìm. Dùng asset PNG đã crop để cả logo trong app và
favicon dùng đúng một dấu hiệu nhận diện.

## Kiểm thế nào là đúng

Chạy dev server rồi mở `/`; kiểm tra logo ở desktop và viewport 375×667. Huy hiệu tròn phải
lấp đầy khung, hải cẩu dễ nhận ra, không có nền trắng thừa lọt ra ngoài. Chạy `npm run lint`.
