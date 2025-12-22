export class CreateUserDto {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  companyIndustry?: string;
  companyDescription?: string;
}

export class UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  companyName?: string;
  companyIndustry?: string;
  companyDescription?: string;
}