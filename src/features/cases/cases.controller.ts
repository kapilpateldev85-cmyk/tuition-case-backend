import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CasesService } from './cases.service';
import {
  CreateCaseDto,
  UpdateCaseDto,
  SearchCasesDto,
  CaseDto,
  RespondInvitationDto,
} from './dto/case.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { Role } from '@prisma/client';

@ApiTags('cases')
@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get('my-invitations')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.TUTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all case invitations for the logged-in tutor' })
  @ApiResponse({ status: 200 })
  async getMyInvitations(@CurrentUser() user: JwtPayload) {
    return this.casesService.getTutorCaseInvitationsByUserId(user.sub);
  }

  @Patch('invitations/:invitationId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.TUTOR)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Accept or decline a case invitation' })
  @ApiResponse({ status: 200 })
  async respondToInvitation(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: JwtPayload,
    @Body() respondDto: RespondInvitationDto,
  ) {
    return this.casesService.respondToInvitation(
      invitationId,
      user.sub,
      respondDto.status,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.PARENT)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new tuition case' })
  @ApiResponse({ status: 201, type: CaseDto })
  async createCase(
    @CurrentUser() user: JwtPayload,
    @Body() createCaseDto: CreateCaseDto,
  ) {
    return this.casesService.createCase(user.sub, createCaseDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List cases with pagination and filters' })
  @ApiResponse({ status: 200 })
  async listCases(
    @CurrentUser() user: JwtPayload,
    @Query() searchDto: SearchCasesDto,
  ) {
    return this.casesService.listCases(searchDto, user.sub);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get case details' })
  @ApiResponse({ status: 200, type: CaseDto })
  async getCase(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.casesService.getCaseWithDetails(id, user.sub);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.PARENT)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Update a case' })
  @ApiResponse({ status: 200, type: CaseDto })
  async updateCase(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() updateCaseDto: UpdateCaseDto,
  ) {
    return this.casesService.updateCase(id, user.sub, updateCaseDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.PARENT)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a case' })
  @ApiResponse({ status: 200 })
  async deleteCase(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.casesService.deleteCase(id, user.sub);
    return { message: 'Case deleted successfully' };
  }

  @Post(':id/invite')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.PARENT)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Invite a tutor to a case' })
  @ApiResponse({ status: 201 })
  async inviteTutor(
    @Param('id') caseId: string,
    @CurrentUser() user: JwtPayload,
    @Body('tutorId') tutorId: string,
  ) {
    await this.casesService.inviteTutor(caseId, tutorId, user.sub);
    return { message: 'Tutor invited successfully' };
  }

  @Delete(':id/invite/:tutorId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.PARENT)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Revoke tutor invitation' })
  @ApiResponse({ status: 200 })
  async revokeTutorInvitation(
    @Param('id') caseId: string,
    @Param('tutorId') tutorId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.casesService.revokeTutorInvitation(caseId, tutorId, user.sub);
    return { message: 'Invitation revoked successfully' };
  }
}
