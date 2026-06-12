import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateTutorProfileDto {
  @ApiProperty()
  @IsString()
  displayName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  qualifications?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  experiences?: string;
}

export class UpdateTutorProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  qualifications?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  experiences?: string;
}

export class TutorProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty({ nullable: true })
  qualifications?: string | null;

  @ApiProperty({ nullable: true })
  experiences?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SearchTutorsDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
