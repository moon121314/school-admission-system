FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY SchoolAdmission.slnx ./
COPY backend/SchoolAdmission.Api/SchoolAdmission.Api.csproj             backend/SchoolAdmission.Api/
COPY backend/SchoolAdmission.Application/SchoolAdmission.Application.csproj backend/SchoolAdmission.Application/
COPY backend/SchoolAdmission.Domain/SchoolAdmission.Domain.csproj       backend/SchoolAdmission.Domain/
COPY backend/SchoolAdmission.Infrastructure/SchoolAdmission.Infrastructure.csproj backend/SchoolAdmission.Infrastructure/
RUN dotnet restore backend/SchoolAdmission.Api/SchoolAdmission.Api.csproj

COPY backend/ backend/
RUN dotnet publish backend/SchoolAdmission.Api/SchoolAdmission.Api.csproj -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /out .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "SchoolAdmission.Api.dll"]