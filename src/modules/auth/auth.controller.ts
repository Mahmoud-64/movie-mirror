import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, TokenDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({ type: TokenDto })
  register(@Body() body: RegisterDto): Promise<TokenDto> {
    return this.auth.register(body.email, body.password);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ type: TokenDto })
  login(@Body() body: LoginDto): Promise<TokenDto> {
    return this.auth.login(body.email, body.password);
  }
}
