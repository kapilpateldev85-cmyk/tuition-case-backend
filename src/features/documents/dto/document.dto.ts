import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DocumentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  caseId: string;

  @ApiProperty()
  uploadedById: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty()
  createdAt: Date;
}

export class TutorDocumentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tutorId: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  uploadedAt: Date;
}
