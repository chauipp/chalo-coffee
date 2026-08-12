import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ScanTableDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tableToken: string;
}
