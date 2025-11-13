{
  description = "A TypeScript project with Nix flakes";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        nodejs = pkgs.nodejs_20;  # or nodejs_22, etc.
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            nodejs
          ];

          shellHook = ''
            echo "TypeScript dev environment loaded"
            echo "Node.js: $(node --version)"
          '';
        };
      }
    );
}
