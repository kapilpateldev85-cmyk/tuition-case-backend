import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { TutorsService } from './tutors.service';
import {
  CreateTutorProfileDto,
  UpdateTutorProfileDto,
  SearchTutorsDto,
  TutorProfileDto,
} from './dto/tutor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { Role } from '@prisma/client';

@ApiTags('tutors')
@Controller('tutors')
export class TutorsController {
  constructor(private readonly tutorsService: TutorsService) {}

  @Get()
  @ApiOperation({ summary: 'List all tutors with pagination and search' })
  @ApiResponse({ status: 200 })
  async listTutors(@Query() searchDto: SearchTutorsDto) {
    return this.tutorsService.listTutors(searchDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.TUTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current tutor profile' })
  @ApiResponse({ status: 200, type: TutorProfileDto })
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.tutorsService.getTutorProfileByUserId(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tutor profile by ID' })
  @ApiResponse({ status: 200, type: TutorProfileDto })
  async getTutorProfile(@Param('id') id: string) {
    return this.tutorsService.getTutorWithDocuments(id);
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.TUTOR)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create tutor profile' })
  @ApiResponse({ status: 201, type: TutorProfileDto })
  async createTutorProfile(
    @CurrentUser() user: JwtPayload,
    @Body() createTutorProfileDto: CreateTutorProfileDto,
  ) {
    return this.tutorsService.createTutorProfile(
      user.sub,
      createTutorProfileDto,
    );
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.TUTOR)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Update current tutor profile' })
  @ApiResponse({ status: 200, type: TutorProfileDto })
  async updateTutorProfile(
    @CurrentUser() user: JwtPayload,
    @Body() updateTutorProfileDto: UpdateTutorProfileDto,
  ) {
    return this.tutorsService.updateTutorProfile(
      user.sub,
      updateTutorProfileDto,
    );
  }
}
