export class AddressEntity {
  id: string;
  userId: string;
  label: string;
  streetAddress: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: Date;
}
