# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS # << NOVA LINHA
import sqlite3
import bcrypt
from database import get_db_connection, init_db # Importa do nosso arquivo database.py

app = Flask(__name__)
CORS(app) # << NOVA LINHA
# app.config['DATABASE'] = DATABASE_PATH # Já definido em database.py, mas pode ser útil

# Inicializa o banco de dados (cria tabelas se não existirem)
# É uma boa prática fazer isso uma vez ao iniciar a aplicação ou através de um comando CLI separado.
# Aqui, vamos chamar para garantir que as tabelas existam ao rodar o app.
# Em produção, você pode querer um comando de CLI para 'flask init-db'
try:
    with app.app_context(): # Para que init_db() funcione dentro do contexto da app Flask
        init_db() # Chama a função para criar tabelas e adicionar usuários de teste se necessário
except Exception as e:
    print(f"Erro durante a inicialização do DB no app.py: {e}")


@app.route('/')
def index():
    return "Servidor PAMDE Backend está no ar!"

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados não enviados no formato JSON"}), 400

    username = data.get('usuario')
    cadastro = data.get('cadastro')
    password = data.get('senha')

    if not username or not cadastro or not password:
        return jsonify({"error": "Usuário, cadastro e senha são obrigatórios"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM usuarios WHERE nome_usuario = ? AND cadastro_operador = ?", (username, cadastro))
        user = cursor.fetchone()

        if user:
            # user['hash_senha'] já é uma string (foi decodificada ao inserir)
            # password precisa ser encodado para o bcrypt.checkpw
            if bcrypt.checkpw(password.encode('utf-8'), user['hash_senha'].encode('utf-8')):
                # Login bem-sucedido
                conn.close()
                return jsonify({
                    "message": "Login bem-sucedido!",
                    "usuario": user['nome_usuario'],
                    "cadastro": user['cadastro_operador']
                }), 200
            else:
                # Senha incorreta
                conn.close()
                return jsonify({"error": "Usuário, cadastro ou senha inválidos."}), 401
        else:
            # Usuário não encontrado
            conn.close()
            return jsonify({"error": "Usuário, cadastro ou senha inválidos."}), 401

    except sqlite3.Error as e:
        print(f"Erro no banco de dados: {e}")
        conn.close()
        return jsonify({"error": "Erro interno no servidor ao processar o login"}), 500
    except Exception as e:
        print(f"Erro inesperado: {e}")
        if conn: # Garante que a conexão exista antes de tentar fechar
            conn.close()
        return jsonify({"error": "Erro interno inesperado no servidor"}), 500
# --- NOVA ROTA DA API PARA EQUIPAMENTOS ---
@app.route('/api/setores/<string:nome_do_setor>/equipamentos', methods=['GET'])
def get_equipamentos_por_setor(nome_do_setor):
    # Validar se nome_do_setor é um dos esperados (opcional, mas bom para segurança)
    setores_validos = ["TESTE", "VEGETAIS", "SAFRA", "AUTOCLAVES", "PREPARACAO", "TORRES"]
    if nome_do_setor.upper() not in setores_validos: # Converte para maiúsculas para ser case-insensitive
        return jsonify({"error": f"Setor '{nome_do_setor}' inválido."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Ordenar para uma apresentação consistente no frontend
        # Você pode ajustar a ordem conforme necessário
        cursor.execute("""
            SELECT * FROM equipamentos
            WHERE setor_principal = ?
            ORDER BY subsetor_nivel1, subsetor_nivel2, nome_componente, indice_componente, tag_motor
        """, (nome_do_setor.upper(),)) # Usa o nome do setor em maiúsculas na query

        # sqlite3.Row já faz com que cada linha seja um dicionário (ou objeto tipo dicionário)
        # Precisamos converter para uma lista de dicionários padrão para o jsonify
        equipamentos_list = [dict(row) for row in cursor.fetchall()]

        conn.close()
        if equipamentos_list:
            return jsonify(equipamentos_list), 200
        else:
            return jsonify({"message": f"Nenhum equipamento encontrado para o setor '{nome_do_setor}'."}), 404
    except sqlite3.Error as e:
        print(f"Erro no banco de dados ao buscar equipamentos para {nome_do_setor}: {e}")
        if conn: conn.close()
        return jsonify({"error": f"Erro interno no servidor ao buscar equipamentos para o setor '{nome_do_setor}'"}), 500
    except Exception as e:
        print(f"Erro inesperado ao buscar equipamentos para {nome_do_setor}: {e}")
        if conn: conn.close()
        return jsonify({"error": "Erro interno inesperado no servidor"}), 500
# --- FIM DA NOVA ROTA ---

if __name__ == '__main__':
    # O host='0.0.0.0' torna o servidor acessível na sua rede local (útil para testar de outros dispositivos)
    # O debug=True é útil para desenvolvimento, pois reinicia o servidor automaticamente após mudanças no código
    # e mostra erros detalhados no navegador. NÃO USE debug=True EM PRODUÇÃO.
    app.run(host='0.0.0.0', port=5000, debug=True)