/** Maps API_SPEC.md §5 error codes to user-facing Vietnamese copy. */
const ERROR_MESSAGES: Record<string, string> = {
  COMMON_9000: 'Dữ liệu không hợp lệ',
  COMMON_9001: 'Bạn thao tác quá nhanh, vui lòng thử lại sau',
  COMMON_9002: 'Đã có lỗi xảy ra, vui lòng thử lại',
  AUTH_1001: 'Phiên đăng nhập đã hết hạn',
  AUTH_1002: 'Email hoặc mật khẩu không đúng',
  AUTH_1003: 'Bạn không có quyền thực hiện thao tác này',
  USER_1010: 'Email hoặc số điện thoại đã được sử dụng',
  RESTAURANT_2001: 'Không tìm thấy nhà hàng',
  RESTAURANT_2002: 'Nhà hàng hiện đã đóng cửa',
  MENU_2010: 'Món ăn hiện không khả dụng',
  CART_3001: 'Giỏ hàng chỉ được chứa món từ một nhà hàng',
  ORDER_3005: 'Không tìm thấy đơn hàng',
  ORDER_3008: 'Trạng thái đơn hàng không hợp lệ',
  ORDER_3009: 'Đơn vừa được cập nhật, vui lòng thử lại',
  DELIVERY_4001: 'Không có tài xế khả dụng trong khu vực',
  PAYMENT_5001: 'Thanh toán bị từ chối',
  PAYMENT_5002: 'Giao dịch trùng lặp với dữ liệu khác',
  PROMO_6001: 'Mã khuyến mãi đã hết hạn hoặc hết lượt dùng',
};

export function mapErrorCode(code: string): string {
  return ERROR_MESSAGES[code] ?? 'Đã có lỗi xảy ra, vui lòng thử lại';
}
