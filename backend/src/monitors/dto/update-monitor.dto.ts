import {
  IsString,
  IsUrl,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class UpdateMonitorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;

  @IsOptional()
  @IsIn(['GET', 'POST', 'HEAD', 'PUT', 'DELETE'])
  method?: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(86400)
  checkInterval?: number;
}
