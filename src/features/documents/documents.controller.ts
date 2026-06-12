import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('cases/:caseId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Upload document to case' })
  @ApiResponse({ status: 201 })
  async uploadCaseDocument(
    @Param('caseId') caseId: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const document = await this.documentsService.uploadCaseDocument(
      caseId,
      user.sub,
      file,
    );
    return { message: 'Document uploaded successfully', document };
  }

  @Post('tutors/profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Upload document to tutor profile' })
  @ApiResponse({ status: 201 })
  async uploadTutorDocument(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const document = await this.documentsService.uploadTutorDocument(
      user.sub,
      file,
    );
    return { message: 'Document uploaded successfully', document };
  }

  @Get('cases/:caseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get case documents' })
  @ApiResponse({ status: 200 })
  async getCaseDocuments(
    @Param('caseId') caseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const documents =
      await this.documentsService.getCaseDocuments(caseId, user.sub);
    return { documents };
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download document' })
  @ApiResponse({ status: 200 })
  async downloadDocument(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const { file, filename, mimeType } =
      await this.documentsService.downloadDocument(id, user.sub);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return res.send(file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({ status: 200 })
  async deleteDocument(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.documentsService.deleteDocument(id, user.sub);
    return { message: 'Document deleted successfully' };
  }
}
