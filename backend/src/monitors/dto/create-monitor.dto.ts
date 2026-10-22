import {
  IsString,
  IsUrl,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateMonitorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  url: string;

  @IsOptional()
  @IsIn(['GET', 'POST', 'HEAD', 'PUT', 'DELETE'])
  method?: string = 'GET';

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(86400)
  checkInterval?: number = 60; // default 60 seconds
}
