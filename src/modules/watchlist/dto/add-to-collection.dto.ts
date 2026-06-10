import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddToCollectionDto {
  @ApiProperty({ description: 'Movie id (uuid) to add' })
  @IsUUID()
  movieId: string;
}
