import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CaseSubject, CaseStatus, CaseLevel, InvitationStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateCaseDto {
  @ApiProperty({ example: 'Weekly P5 Math tuition near Bishan' })
  @IsString()
  title: string;

  @ApiProperty({ enum: CaseSubject, example: 'MATHEMATICS' })
  @IsEnum(CaseSubject)
  subject: CaseSubject;

  @ApiProperty({ enum: CaseLevel, example: 'P5' })
  @IsEnum(CaseLevel)
  level: CaseLevel;

  @ApiProperty({ example: 'Bishan' })
  @IsString()
  location: string;

  @ApiProperty({ example: 50, description: 'Budget per hour' })
  @IsNumber()
  @Min(1)
  @Max(1000)
  budgetPerHour: number;

  @ApiProperty({ required: false, description: 'Optional context about the case requirements' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCaseDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(CaseSubject)
  subject?: CaseSubject;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(CaseLevel)
  level?: CaseLevel;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  budgetPerHour?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;
}

export class CaseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  subject: CaseSubject;

  @ApiProperty()
  level: CaseLevel;

  @ApiProperty()
  location: string;

  @ApiProperty()
  budgetPerHour: number;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  status: CaseStatus;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SearchCasesDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: CaseSubject })
  @IsOptional()
  @IsEnum(CaseSubject)
  subject?: CaseSubject;

  @ApiProperty({ required: false, enum: CaseLevel })
  @IsOptional()
  @IsEnum(CaseLevel)
  level?: CaseLevel;

  @ApiProperty({ required: false, enum: CaseStatus })
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;
}

export class RespondInvitationDto {
  @ApiProperty({ enum: InvitationStatus, example: 'ACCEPTED' })
  @IsEnum(InvitationStatus)
  status: InvitationStatus;
}
