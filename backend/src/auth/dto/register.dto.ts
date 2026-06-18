import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmail, trimString } from '../../common/transforms';

export class RegisterDto {
  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MaxLength(120)
  @Transform(trimString)
  fullName: string;

  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail({}, { message: 'A valid email address is required' })
  @Transform(normalizeEmail)
  email: string;

  @ApiProperty({ example: 'StrongP@ssw0rd', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72, { message: 'Password must be at most 72 characters long' })
  password: string;
}
