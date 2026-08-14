# Hiển thị logo huy hiệu Chalo

## Khi nào gặp lại

Logo nhìn như bị thu nhỏ hoặc phần hình hải cẩu bị lọt thỏm dù đã tăng kích thước thẻ chứa.

## Cách làm đúng

`chalo-fe/public/brand/chalo-logo.jpg` chứa huy hiệu tròn ở giữa một vùng nền trắng lớn.
Component `chalo-fe/src/components/shared/BrandLogo.tsx` dùng `.brand-logo-frame` làm khung
overflow và `.brand-logo-art` với `object-fit: cover` + `transform: scale(1.52)` để chỉ phần
huy hiệu chiếm khung hiển thị.

## Cái bẫy

Chỉ thêm `object-contain` hoặc tăng `width/height` cho `<img>` không cắt được khoảng trắng;
hình tròn vẫn nhỏ và hải cẩu trông bị chìm. Không cần thay asset gốc nếu mọi nơi dùng chung;
hãy crop ở lớp hiển thị.

## Kiểm thế nào là đúng

Chạy dev server rồi mở `/`; kiểm tra logo ở desktop và viewport 375×667. Huy hiệu tròn phải
lấp đầy khung, hải cẩu dễ nhận ra, không có nền trắng thừa lọt ra ngoài. Chạy `npm run lint`.
