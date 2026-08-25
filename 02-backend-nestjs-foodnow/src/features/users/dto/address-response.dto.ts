export class AddressResponseDto {
  id: string;
  label: string;
  streetAddress: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: Date;
}
