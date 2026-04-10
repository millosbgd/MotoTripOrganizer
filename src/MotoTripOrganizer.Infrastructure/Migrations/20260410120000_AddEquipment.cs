using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MotoTripOrganizer.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEquipment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Šifarnik opreme ──────────────────────────────────────────────
            migrationBuilder.CreateTable(
                name: "EquipmentCatalogItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EquipmentCatalogItems", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EquipmentCatalogItems_Category",
                table: "EquipmentCatalogItems",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_EquipmentCatalogItems_Name",
                table: "EquipmentCatalogItems",
                column: "Name",
                unique: true);

            // ── Unosi opreme po tripu ────────────────────────────────────────
            migrationBuilder.CreateTable(
                name: "TripEquipmentEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TripId = table.Column<int>(type: "int", nullable: false),
                    EquipmentCatalogItemId = table.Column<int>(type: "int", nullable: false),
                    CarriedByUserId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    Note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    UpdatedByUserId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TripEquipmentEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TripEquipmentEntries_Trips_TripId",
                        column: x => x.TripId,
                        principalTable: "Trips",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TripEquipmentEntries_EquipmentCatalogItems_EquipmentCatalogItemId",
                        column: x => x.EquipmentCatalogItemId,
                        principalTable: "EquipmentCatalogItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TripEquipmentEntries_Users_CarriedByUserId",
                        column: x => x.CarriedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TripEquipmentEntries_TripId",
                table: "TripEquipmentEntries",
                column: "TripId");

            migrationBuilder.CreateIndex(
                name: "IX_TripEquipmentEntries_EquipmentCatalogItemId",
                table: "TripEquipmentEntries",
                column: "EquipmentCatalogItemId");

            migrationBuilder.CreateIndex(
                name: "IX_TripEquipmentEntries_CarriedByUserId",
                table: "TripEquipmentEntries",
                column: "CarriedByUserId");

            // ── Seed šifarnika ───────────────────────────────────────────────
            migrationBuilder.InsertData(
                table: "EquipmentCatalogItems",
                columns: new[] { "Name", "Description", "Category" },
                values: new object[,]
                {
                    // Alat
                    { "Set za krpljenje guma", "Gumeni lepkovi, zakrpe, alat za vađenje uloška ventila", "Alat" },
                    { "Kompresor za gume", "Prenosni električni kompresor / ručna pumpa", "Alat" },
                    { "Motorna dizalica", "Kompaktna dizalica ili stand za motocikl", "Alat" },
                    { "Osnovna kutija alata", "Ključevi, odvijači, klješta, imbus ključevi", "Alat" },
                    { "Set viličastih ključeva", "Komplet otvorenih ključeva raznih veličina", "Alat" },
                    { "Set nasadnih ključeva", "Komplet nasadnih ključeva sa račnom", "Alat" },
                    { "Rezervni lanci i karike", "Rezervni motociklistički lanac ili master karike", "Alat" },
                    { "Gumeni čekić", "Za montažu i demontažu bez oštećenja", "Alat" },
                    { "Lepljiva / izolir traka", "Električna i gaffer traka za improvizovane popravke", "Alat" },
                    { "Zip vezice (asortiman)", "Plastične vezice raznih veličina", "Alat" },
                    // Gorivo i mazivo
                    { "Rezervno ulje za motor", "Litara+ motornog ulja odgovarajuće viskoznosti", "Gorivo i mazivo" },
                    { "Kočiona tečnost", "DOT 4 ili DOT 5.1 kočiona tečnost", "Gorivo i mazivo" },
                    { "Rashladna tečnost", "Antifriz / destilisana voda za sistem hlađenja", "Gorivo i mazivo" },
                    { "Mazivo za lanac", "Sprej ili tečno mazivo za lanac motocikla", "Gorivo i mazivo" },
                    { "Rezervni kanister za gorivo", "Plastični sigurnosni kanister 5L", "Gorivo i mazivo" },
                    // Električna oprema
                    { "Booster / startna baterija", "Prenosni litijumski booster za paljenje motocikla", "Električna oprema" },
                    { "Rezervni osigurači i žarulje", "Komplet osigurača raznih amperaža i rezervnih sijalica", "Električna oprema" },
                    { "Multimetar", "Digitalni multimetar za dijagnostiku elektrike", "Električna oprema" },
                    { "Power bank", "Prenosna baterija za punjenje uređaja na putu", "Električna oprema" },
                    { "Punjač za bateriju motocikla", "Optičke/pametni punjač sa CTEK ili sličan", "Električna oprema" },
                    { "Baterijska lampa / fenjer", "Jaka LED lampa za rad u mraku", "Električna oprema" },
                    // Sigurnost
                    { "Reflektujući prsluk", "CE sertifikovan reflektujući prsluk (obavezan u nekim zemljama)", "Sigurnost" },
                    { "Uže za vuču", "Čelično ili sintetičko uže za vuču motocikla", "Sigurnost" },
                    { "Vatrogasni aparat", "Kompaktni S2 aparat za motocikle", "Sigurnost" },
                    // Navigacija
                    { "GPS uređaj / navigacija", "Dedicated GPS uređaj ili nosač telefona sa navigacijom", "Navigacija" },
                    // Medicinska oprema
                    { "Set prve pomoći", "Kompletna torba prve pomoći prilagođena motociklistima", "Medicinska oprema" },
                    // Lična oprema
                    { "Kišna oprema (pončo/kombinezon)", "Vodootporna kišna oprema za vozača", "Lična oprema" },
                    { "Bungee kordoni i mrežice", "Za pričvršćivanje prtljaga na motocikl", "Lična oprema" },
                    { "Sigurnosna traka za prtljag", "Ratchet ili cam buckle strop trake", "Lična oprema" },
                    { "Rezervne rukavice", "Rezervni par motociklističkih rukavica", "Lična oprema" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "TripEquipmentEntries");
            migrationBuilder.DropTable(name: "EquipmentCatalogItems");
        }
    }
}
