# backend/database.py
import sqlite3
import os
import bcrypt

# ... (caminhos BASE_DIR, INSTANCE_FOLDER_PATH, DATABASE_PATH permanecem os mesmos) ...
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANCE_FOLDER_PATH = os.path.join(BASE_DIR, 'instance')
DATABASE_PATH = os.path.join(INSTANCE_FOLDER_PATH, 'pamde_app.db') 
def get_db_connection():
    # ... (sem alterações) ...
    if not os.path.exists(INSTANCE_FOLDER_PATH):
        os.makedirs(INSTANCE_FOLDER_PATH)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# backend/database.py

# ... (imports e definições de DATABASE_PATH no topo) ...

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Criação da tabela de usuários (existente)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_usuario TEXT NOT NULL UNIQUE,
            cadastro_operador TEXT NOT NULL UNIQUE,
            hash_senha TEXT NOT NULL
        )
    ''')
    print("Tabela 'usuarios' verificada/criada.")

    # Criação da tabela de equipamentos (existente)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS equipamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tag_motor TEXT NOT NULL,
            setor_principal TEXT NOT NULL,
            subsetor_nivel1 TEXT,
            subsetor_nivel2 TEXT,
            nome_componente TEXT,
            indice_componente INTEGER DEFAULT 0,
            potencia_kw_nominal REAL,
            potencia_cv_nominal REAL,
            tensao_v_nominal INTEGER,
            corrente_a_nominal REAL,
            rotacao_rpm_nominal INTEGER,
            marca_nominal TEXT,
            modelo_nominal TEXT,
            rolamento_d_nominal TEXT,
            rolamento_t_nominal TEXT,
            regulagem_corrente_nominal TEXT,
            UNIQUE(tag_motor)
        )
    ''')
    print("Tabela 'equipamentos' verificada/criada.")

    # Adicionar usuários de teste
    cursor.execute("SELECT COUNT(*) FROM usuarios")
    user_count = cursor.fetchone()[0]

    if user_count == 0: # Só adiciona se a tabela de usuários estiver vazia
        print("Nenhum usuário encontrado. Adicionando usuários especificados...")
        try:
            # Usuário 1: Admin
            nome_usuario_1 = "Admin"
            cadastro_1 = "0000"
            senha_1_plain = "000000" # Senha para Admin
            hashed_senha_1 = bcrypt.hashpw(senha_1_plain.encode('utf-8'), bcrypt.gensalt())
            cursor.execute("INSERT INTO usuarios (nome_usuario, cadastro_operador, hash_senha) VALUES (?, ?, ?)",
            (nome_usuario_1, cadastro_1, hashed_senha_1.decode('utf-8')))

            # Usuário 2: Juliano Paiva Teixeira
            nome_usuario_2 = "Juliano Paiva Teixeira"
            cadastro_2 = "5941"
            senha_2_plain = "521489" # Senha para Juliano
            hashed_senha_2 = bcrypt.hashpw(senha_2_plain.encode('utf-8'), bcrypt.gensalt())
            cursor.execute("INSERT INTO usuarios (nome_usuario, cadastro_operador, hash_senha) VALUES (?, ?, ?)",
            (nome_usuario_2, cadastro_2, hashed_senha_2.decode('utf-8')))

            # Usuário 3: Johnnatan Krause Ribeiro Moreno
            nome_usuario_3 = "Johnnatan Krause Ribeiro Moreno"
            cadastro_3 = "1218"
            senha_3_plain = "964723" # Senha para Johnnatan
            hashed_senha_3 = bcrypt.hashpw(senha_3_plain.encode('utf-8'), bcrypt.gensalt())
            cursor.execute("INSERT INTO usuarios (nome_usuario, cadastro_operador, hash_senha) VALUES (?, ?, ?)",
            (nome_usuario_3, cadastro_3, hashed_senha_3.decode('utf-8')))

            conn.commit()
            print("Usuários (Admin, Juliano, Johnnatan) adicionados com sucesso.")
        except sqlite3.IntegrityError as e:
            print(f"Erro de integridade ao adicionar usuários (talvez nome/cadastro duplicado): {e}")
        except Exception as e:
            print(f"Erro inesperado ao adicionar usuários: {e}")
    else:
        print(f"{user_count} usuário(s) já existem na base de usuários.")

    conn.close()

# ... (o resto do arquivo database.py, incluindo if __name__ == '__main__':) ...

if __name__ == '__main__':
    # ... (sem grandes alterações, talvez adicionar uma verificação da tabela equipamentos) ...
    print(f"Caminho do banco de dados: {DATABASE_PATH}")
    init_db()
    print("Inicialização do banco de dados concluída.")

    conn_check = get_db_connection()
    cursor_check = conn_check.cursor()
    print("\nVerificando tabela 'usuarios':")
    cursor_check.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios';")
    if cursor_check.fetchone():
        print("- Tabela 'usuarios' existe.")
        cursor_check.execute("SELECT nome_usuario, cadastro_operador FROM usuarios LIMIT 2")
        users = cursor_check.fetchall()
        if users:
            for user in users:
                print(f"  - Exemplo Usuário: {user['nome_usuario']}, Cadastro: {user['cadastro_operador']}")
        else:
            print("  - Nenhum usuário encontrado para listar.")
    else:
        print("- Tabela 'usuarios' NÃO existe.")

    print("\nVerificando tabela 'equipamentos':")
    cursor_check.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='equipamentos';")
    if cursor_check.fetchone():
        print("- Tabela 'equipamentos' existe.")
        cursor_check.execute("SELECT tag_motor, setor_principal FROM equipamentos LIMIT 2")
        equip = cursor_check.fetchall()
        if equip:
            for eq in equip:
                print(f"  - Exemplo Equipamento: {eq['tag_motor']}, Setor: {eq['setor_principal']}")
        else:
            print("  - Nenhum equipamento encontrado para listar (esperado se o data_loader ainda não rodou).")

    else:
        print("- Tabela 'equipamentos' NÃO existe.")
    conn_check.close()